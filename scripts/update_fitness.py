"""
Updates fitness-tracker/data/fitness.json.

Right now: generates realistic demo data to prove the pipeline works.
Replace the generate_today() function with real Notion API calls when ready.
"""

import json
import random
import math
from datetime import datetime, timedelta
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "fitness-tracker" / "data" / "fitness.json"


def generate_today():
    """Simulates today's stats. Replace this with Notion API calls."""
    now = datetime.utcnow()
    # Vary values slightly based on day-of-year so each run looks different
    seed = now.timetuple().tm_yday + now.hour
    random.seed(seed)

    steps    = random.randint(6000, 14000)
    calories = random.randint(1600, 3200)
    hr       = random.randint(62, 82)
    sleep_h  = random.randint(6, 9)
    sleep_m  = random.randint(0, 59)

    return {
        "steps": steps,
        "calories": calories,
        "heartRate": hr,
        "sleep": {"hours": sleep_h, "minutes": sleep_m},
        "_updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def generate_week():
    """Last 7 days of data. Replace with Notion query when ready."""
    labels, steps, hr, calories = [], [], [], []
    today = datetime.utcnow()
    random.seed(today.timetuple().tm_yday)

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        labels.append(day.strftime("%a"))
        steps.append(random.randint(5000, 13000))
        hr.append(random.randint(65, 80))
        calories.append(random.randint(1500, 3000))

    return {"labels": labels, "steps": steps, "heartRate": hr, "calories": calories}


def main():
    with open(DATA_FILE) as f:
        data = json.load(f)

    data["today"]  = generate_today()
    data["week"]   = generate_week()

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Updated {DATA_FILE} at {data['today']['_updated']}")


if __name__ == "__main__":
    main()
