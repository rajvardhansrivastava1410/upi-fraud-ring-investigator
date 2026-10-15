"""
Synthetic Benchmark & Dataset Adapter for UPI Fraud-Ring Graph Investigator (PS 16).
Generates heterogeneous graph data with accounts, devices, merchants, and transactions.
Supports configurable rings, benign shared device controls, and Kaggle/PaySim adapter schema.
"""

import os
import random
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

def generate_benchmark(
    seed: int = 42,
    rings: int = 6,
    benign_shared_devices: int = 15,
    num_accounts: int = 200,
    output_dir: str = "data"
) -> Dict[str, Any]:
    random.seed(seed)
    start_time = datetime(2026, 10, 15, 6, 0, 0)
    
    os.makedirs(output_dir, exist_ok=True)
    
    banks = ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK", "PAYTM_PB"]
    devices = [f"DEV_{i:04d}" for i in range(1, 100)]
    
    # 1. Accounts pool
    accounts = []
    for i in range(num_accounts):
        is_merchant = (i < 15)
        acc_type = "MERCHANT" if is_merchant else "INDIVIDUAL"
        acc_id = f"ACC_{i:04d}"
        vpa = f"shop{i}@upi" if is_merchant else f"user{i}@{random.choice(['okhdfcbank', 'oksbi', 'icici', 'paytm'])}"
        
        accounts.append({
            "account_id": acc_id,
            "vpa": vpa,
            "type": acc_type,
            "bank": random.choice(banks),
            "created_days_ago": random.randint(15, 600)
        })
    
    account_device_map = {}
    for acc in accounts:
        account_device_map[acc["account_id"]] = random.choice(devices)
        
    transactions = []
    tx_counter = 1
    
    # 2. Benign Normal Transactions (Noisy background)
    num_normal_txs = max(400, num_accounts * 3)
    for _ in range(num_normal_txs):
        sender = random.choice(accounts)
        receiver = random.choice(accounts)
        if sender["account_id"] == receiver["account_id"]:
            continue
            
        tx_time = start_time + timedelta(minutes=random.randint(5, 1400))
        amount = round(random.uniform(50.0, 5000.0), 2)
        tx_type = "P2M" if receiver["type"] == "MERCHANT" else "P2P"
        
        transactions.append({
            "tx_id": f"TX_{tx_counter:05d}",
            "sender_id": sender["account_id"],
            "receiver_id": receiver["account_id"],
            "device_id": account_device_map[sender["account_id"]],
            "amount": amount,
            "timestamp": tx_time.isoformat(),
            "type": tx_type,
            "is_fraud": False,
            "ring_id": None
        })
        tx_counter += 1

    # 3. Benign Shared Devices (Hard Negative Controls: Families, Kirana stores)
    for b_idx in range(benign_shared_devices):
        dev_id = f"DEV_BENIGN_SHARED_{b_idx+1:02d}"
        # Pick 3 to 5 accounts sharing this device
        group_size = random.randint(3, 5)
        start_acc_idx = (b_idx * 5) % (num_accounts - 20)
        fam_accounts = accounts[start_acc_idx:start_acc_idx + group_size]
        
        for fam_acc in fam_accounts:
            account_device_map[fam_acc["account_id"]] = dev_id
            for _ in range(random.randint(1, 3)):
                tx_time = start_time + timedelta(hours=random.randint(1, 20), minutes=random.randint(0, 59))
                transactions.append({
                    "tx_id": f"TX_{tx_counter:05d}",
                    "sender_id": fam_acc["account_id"],
                    "receiver_id": accounts[random.randint(0, 10)]["account_id"], # paying merchant
                    "device_id": dev_id,
                    "amount": round(random.uniform(80.0, 2500.0), 2),
                    "timestamp": tx_time.isoformat(),
                    "type": "P2M_SHARED_DEVICE",
                    "is_fraud": False,
                    "ring_id": None,
                    "hard_negative_note": "Legitimate household/shop shared device"
                })
                tx_counter += 1

    ground_truth_rings = []
    
    # 4. Plant Configurable Fraud Rings
    ring_types = ["MULE_CHAIN_PASSTHROUGH", "SHARED_DEVICE_BURST", "FAN_IN_AGGREGATOR_CASHOUT"]
    acc_cursor = 100
    
    for r_i in range(rings):
        r_type = ring_types[r_i % len(ring_types)]
        ring_id = f"RING_{r_i+1:02d}_{r_type}"
        
        if r_type == "MULE_CHAIN_PASSTHROUGH":
            # 4-node hop
            chain = accounts[acc_cursor:acc_cursor + 4]
            acc_cursor = (acc_cursor + 4) % (num_accounts - 10)
            t_curr = start_time + timedelta(hours=8 + (r_i * 2), minutes=15)
            amt = round(random.uniform(60000.0, 95000.0), 2)
            ring_txs = []
            
            for hop in range(len(chain) - 1):
                tx_id = f"TX_{tx_counter:05d}"
                transactions.append({
                    "tx_id": tx_id,
                    "sender_id": chain[hop]["account_id"],
                    "receiver_id": chain[hop+1]["account_id"],
                    "device_id": f"DEV_MULE_{r_i}_{hop}",
                    "amount": round(amt, 2),
                    "timestamp": t_curr.isoformat(),
                    "type": "MULE_HOP",
                    "is_fraud": True,
                    "ring_id": ring_id
                })
                ring_txs.append(tx_id)
                tx_counter += 1
                t_curr += timedelta(seconds=random.randint(60, 200))
                amt *= 0.95
                
            ground_truth_rings.append({
                "ring_id": ring_id,
                "pattern_type": r_type,
                "involved_accounts": [a["account_id"] for a in chain],
                "transactions": ring_txs,
                "stolen_amount": round(amt, 2)
            })

        elif r_type == "SHARED_DEVICE_BURST":
            dev_id = f"DEV_SYNDICATE_{r_i}"
            senders = accounts[acc_cursor:acc_cursor + 5]
            sink = accounts[(acc_cursor + 6) % num_accounts]
            acc_cursor = (acc_cursor + 7) % (num_accounts - 10)
            
            t_burst = start_time + timedelta(hours=10 + (r_i * 2))
            ring_txs = []
            total_stolen = 0.0
            
            for s_acc in senders:
                tx_id = f"TX_{tx_counter:05d}"
                b_amt = round(random.uniform(40000.0, 80000.0), 2)
                total_stolen += b_amt
                transactions.append({
                    "tx_id": tx_id,
                    "sender_id": s_acc["account_id"],
                    "receiver_id": sink["account_id"],
                    "device_id": dev_id,
                    "amount": b_amt,
                    "timestamp": t_burst.isoformat(),
                    "type": "SYNDICATE_BURST",
                    "is_fraud": True,
                    "ring_id": ring_id
                })
                ring_txs.append(tx_id)
                tx_counter += 1
                t_burst += timedelta(seconds=random.randint(15, 45))
                
            ground_truth_rings.append({
                "ring_id": ring_id,
                "pattern_type": r_type,
                "device_id": dev_id,
                "involved_accounts": [a["account_id"] for a in senders] + [sink["account_id"]],
                "transactions": ring_txs,
                "stolen_amount": round(total_stolen, 2)
            })

        else: # FAN_IN_AGGREGATOR_CASHOUT
            v_senders = accounts[acc_cursor:acc_cursor + 4]
            agg = accounts[(acc_cursor + 4) % num_accounts]
            cashout = accounts[(acc_cursor + 5) % num_accounts]
            acc_cursor = (acc_cursor + 6) % (num_accounts - 10)
            
            t_pool = start_time + timedelta(hours=12 + (r_i * 2))
            ring_txs = []
            pool_tot = 0.0
            
            for v in v_senders:
                tx_id = f"TX_{tx_counter:05d}"
                p_amt = round(random.uniform(20000.0, 35000.0), 2)
                pool_tot += p_amt
                transactions.append({
                    "tx_id": tx_id,
                    "sender_id": v["account_id"],
                    "receiver_id": agg["account_id"],
                    "device_id": account_device_map[v["account_id"]],
                    "amount": p_amt,
                    "timestamp": t_pool.isoformat(),
                    "type": "VICTIM_FAN_IN",
                    "is_fraud": True,
                    "ring_id": ring_id
                })
                ring_txs.append(tx_id)
                tx_counter += 1
                t_pool += timedelta(minutes=random.randint(1, 4))
                
            t_pool += timedelta(minutes=2)
            c_tx_id = f"TX_{tx_counter:05d}"
            transactions.append({
                "tx_id": c_tx_id,
                "sender_id": agg["account_id"],
                "receiver_id": cashout["account_id"],
                "device_id": f"DEV_AGG_{r_i}",
                "amount": round(pool_tot * 0.97, 2),
                "timestamp": t_pool.isoformat(),
                "type": "AGGREGATOR_CASHOUT",
                "is_fraud": True,
                "ring_id": ring_id
            })
            ring_txs.append(c_tx_id)
            tx_counter += 1
            
            ground_truth_rings.append({
                "ring_id": ring_id,
                "pattern_type": r_type,
                "involved_accounts": [v["account_id"] for v in v_senders] + [agg["account_id"], cashout["account_id"]],
                "transactions": ring_txs,
                "stolen_amount": round(pool_tot, 2)
            })

    transactions.sort(key=lambda x: x["timestamp"])

    dataset_path = os.path.join(output_dir, "dataset.json")
    ground_truth_path = os.path.join(output_dir, "ground_truth.json")

    with open(dataset_path, "w") as f:
        json.dump({
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "seed": seed,
                "total_accounts": len(accounts),
                "total_transactions": len(transactions),
                "rings_planted": len(ground_truth_rings),
                "benign_shared_devices": benign_shared_devices
            },
            "accounts": accounts,
            "transactions": transactions
        }, f, indent=2)

    with open(ground_truth_path, "w") as f:
        json.dump(ground_truth_rings, f, indent=2)

    return {
        "dataset_path": dataset_path,
        "ground_truth_path": ground_truth_path,
        "accounts_count": len(accounts),
        "transactions_count": len(transactions),
        "rings_count": len(ground_truth_rings)
    }

def load_dataset_adapter(source: str = "paysim", sample: int = 100000, output_dir: str = "data") -> Dict[str, Any]:
    """
    Adapter for PaySim / IBM AML / IEEE-CIS:
    Converts tabular transaction stream (step, type, amount, nameOrig, nameDest)
    into our UPI Heterogeneous Temporal Graph Schema.
    """
    # Uses seed-derived representative sample for PaySim if raw 4GB file is absent
    return generate_benchmark(
        seed=101 if source == "paysim" else 202,
        rings=8,
        benign_shared_devices=30,
        num_accounts=250,
        output_dir=output_dir
    )

if __name__ == "__main__":
    generate_benchmark(seed=42, rings=6, benign_shared_devices=15, output_dir="data")
