#!/usr/bin/env python3
"""
Bulk add Twitter handles from a simple text format

Usage:
    python3 scripts/add_handles_bulk.py input.txt

Input format (one per line):
    Full Name | twitter_handle | Field

Example:
    Paul Krugman | NYTimesKrugman | Economics
    Neil deGrasse Tyson | neiltyson | Physics
    Carl Zimmer | carlzimmer | Biology

Or just:
    Full Name | twitter_handle

The field is optional - just helps with organization.
"""

import sys
import json
import os
from collections import OrderedDict

def parse_line(line):
    """Parse a line into name, handle, field"""
    line = line.strip()
    if not line or line.startswith('#'):
        return None

    parts = [p.strip() for p in line.split('|')]

    if len(parts) < 2:
        print(f"⚠️  Skipping invalid line: {line}")
        return None

    name = parts[0]
    handle = parts[1].lstrip('@')  # Remove @ if present
    field = parts[2] if len(parts) > 2 else None

    return {'name': name, 'handle': handle, 'field': field}

def load_from_file(filepath):
    """Load handles from text file"""
    handles = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            parsed = parse_line(line)
            if parsed:
                handles[parsed['name']] = parsed['handle']
                if parsed['field']:
                    print(f"  ✓ {parsed['name']} (@{parsed['handle']}) - {parsed['field']}")
                else:
                    print(f"  ✓ {parsed['name']} (@{parsed['handle']})")

    return handles

def load_existing_handles(json_path):
    """Load existing handles from JSON"""
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {k: v for k, v in data.items() if not k.startswith('_')}
    return {}

def save_handles(handles, json_path):
    """Save handles to JSON file"""
    output = OrderedDict()
    output['_comment'] = "Maps author names to Twitter handles. Add entries as you discover academic Twitter accounts."
    output['_instructions'] = "Format: 'Full Name as it appears in papers': 'twitter_handle' (without @)"
    output['_last_updated'] = "Manually curated + Zenodo CS researchers dataset"
    output['_count'] = len(handles)

    # Sort alphabetically
    for name in sorted(handles.keys()):
        output[name] = handles[name]

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/add_handles_bulk.py input.txt")
        print("\nInput format (one per line):")
        print("  Full Name | twitter_handle | Field (optional)")
        print("\nExample:")
        print("  Paul Krugman | NYTimesKrugman | Economics")
        print("  Neil deGrasse Tyson | neiltyson | Physics")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    print("=" * 70)
    print("📥 Bulk Adding Twitter Handles")
    print("=" * 70)

    # Load existing handles
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'author_twitter_handles.json')

    print(f"\n📂 Loading existing handles from {json_path}...")
    existing = load_existing_handles(json_path)
    print(f"   Found {len(existing):,} existing handles")

    # Load new handles from file
    print(f"\n📥 Loading new handles from {input_file}...")
    new_handles = load_from_file(input_file)
    print(f"\n   Loaded {len(new_handles):,} new handles")

    # Merge
    added = 0
    updated = 0

    for name, handle in new_handles.items():
        if name in existing:
            if existing[name] != handle:
                print(f"\n⚠️  Updating: {name}")
                print(f"    Old: @{existing[name]}")
                print(f"    New: @{handle}")
                existing[name] = handle
                updated += 1
        else:
            existing[name] = handle
            added += 1

    # Save
    print(f"\n💾 Saving to {json_path}...")
    save_handles(existing, json_path)

    print("\n" + "=" * 70)
    print("✅ Complete!")
    print("=" * 70)
    print(f"Added:   {added:,} new handles")
    print(f"Updated: {updated:,} existing handles")
    print(f"Total:   {len(existing):,} handles in database")
    print("=" * 70)

if __name__ == '__main__':
    main()
