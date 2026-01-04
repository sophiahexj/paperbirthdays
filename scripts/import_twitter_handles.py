#!/usr/bin/env python3
"""
Import academic Twitter handles from various sources into author_twitter_handles.json

Sources:
1. Zenodo dataset: Computer Science researchers (9,191 verified researchers)
2. Manual additions (can be added to the JSON file)
3. Future: ORCID, other discipline-specific lists

Usage:
    python3 scripts/import_twitter_handles.py
"""

import json
import csv
import os
from collections import OrderedDict

def load_existing_handles(json_path):
    """Load existing Twitter handles from JSON file"""
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Filter out comment/instruction keys
            return {k: v for k, v in data.items() if not k.startswith('_')}
    return {}

def import_from_zenodo_cs_researchers(tsv_path):
    """
    Import computer science researchers from Zenodo dataset

    Returns dict of {Author Name: twitter_handle}
    """
    handles = {}

    if not os.path.exists(tsv_path):
        print(f"⚠️  File not found: {tsv_path}")
        print("    Download from: https://zenodo.org/records/12942/files/candidates_matched.tsv?download=1")
        return handles

    with open(tsv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')

        for row in reader:
            screen_name = row.get('screen name', '').strip()
            full_name = row.get('name', '').strip()

            if screen_name and full_name:
                # Clean up the Twitter handle (remove @ if present)
                handle = screen_name.lstrip('@')
                handles[full_name] = handle

    print(f"✅ Imported {len(handles):,} Computer Science researchers from Zenodo")
    return handles

def merge_handles(existing, new_handles):
    """
    Merge new handles with existing ones

    Rules:
    - Keep existing entries (don't overwrite)
    - Add new entries
    - Report conflicts
    """
    merged = existing.copy()
    added = 0
    conflicts = 0

    for name, handle in new_handles.items():
        if name in merged:
            if merged[name] != handle:
                conflicts += 1
                print(f"  ⚠️  Conflict: {name}")
                print(f"      Existing: @{merged[name]}")
                print(f"      New:      @{handle}")
                print(f"      Keeping existing")
        else:
            merged[name] = handle
            added += 1

    print(f"✅ Added {added:,} new handles")
    if conflicts > 0:
        print(f"⚠️  Skipped {conflicts} conflicting entries (kept existing)")

    return merged

def save_handles(handles, json_path):
    """Save handles to JSON file with nice formatting"""
    # Add instructions at the top
    output = OrderedDict()
    output['_comment'] = "Maps author names to Twitter handles. Add entries as you discover academic Twitter accounts."
    output['_instructions'] = "Format: 'Full Name as it appears in papers': 'twitter_handle' (without @)"
    output['_last_updated'] = "Auto-imported from Zenodo CS researchers dataset"
    output['_count'] = len(handles)

    # Sort handles alphabetically by author name
    for name in sorted(handles.keys()):
        output[name] = handles[name]

    # Write with nice indentation
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(handles):,} handles to {json_path}")

def main():
    """Main import process"""
    print("=" * 70)
    print("📥 Importing Academic Twitter Handles")
    print("=" * 70)

    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'author_twitter_handles.json')
    zenodo_tsv = os.path.join(script_dir, '..', 'data', 'academic_twitter', 'researchers_cs.tsv')

    # Load existing handles
    print("\n📂 Loading existing handles...")
    existing_handles = load_existing_handles(json_path)
    print(f"   Found {len(existing_handles):,} existing handles")

    # Import from Zenodo CS researchers dataset
    print("\n📥 Importing from Zenodo CS researchers dataset...")
    zenodo_handles = import_from_zenodo_cs_researchers(zenodo_tsv)

    # Merge handles
    print("\n🔀 Merging handles...")
    all_handles = merge_handles(existing_handles, zenodo_handles)

    # Save to file
    print("\n💾 Saving to file...")
    save_handles(all_handles, json_path)

    print("\n" + "=" * 70)
    print("✅ Import complete!")
    print("=" * 70)
    print(f"Total handles: {len(all_handles):,}")
    print(f"  - Computer Science: {len(zenodo_handles):,}")
    print(f"  - Other/Manual: {len(existing_handles):,}")
    print("\n💡 Next steps:")
    print("  1. Test the tweet script: python3 scripts/tweet_daily.py --dry-run")
    print("  2. Add more handles manually to scripts/author_twitter_handles.json")
    print("  3. Search for discipline-specific Twitter lists to import")
    print("=" * 70)

if __name__ == '__main__':
    main()
