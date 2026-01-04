# Author Twitter Handle System

## Overview

This system automatically tags authors in tweets when they have Twitter accounts, significantly increasing engagement and reach.

## How It Works

1. **Paper Selection Priority**
   - First checks top 50 papers for any authors with known Twitter handles
   - If found, randomly selects from those papers
   - If none found, falls back to top 10 most-cited papers

2. **Tweet Format**
   - Title with exclamation mark
   - Author Twitter handles (if found)
   - Citation count
   - Field hashtag
   - Link to site

**Example with author tags:**
```
Neural Networks for Pattern Recognition turns 30 today!

@BishopCMRBishop

Cited 15,234 times.

#ComputerScience
📄 https://happybdaypaper.com
```

**Example without author tags:**
```
Deep Learning turns 12 today!

Cited 8,432 times.

#ComputerScience
📄 https://happybdaypaper.com
```

## Growing the Author Database

### Method 1: Manual Curation
As you see papers being tweeted, search for authors on Twitter and add them to `author_twitter_handles.json`:

```json
{
  "Full Name": "twitter_handle",
  "Jane Doe": "janedoe_phd"
}
```

### Method 2: Academic Twitter Lists
Many curated lists exist:
- Follow academic Twitter accounts in your field
- Check "Science Twitter" lists
- Look at conference hashtags (#NeurIPS, #ICML, etc.)

### Method 3: Author Websites
Many academics list their Twitter on:
- Google Scholar profiles
- University faculty pages
- Personal websites
- Semantic Scholar profiles

### Method 4: Automated Discovery (Advanced)
For bulk additions, you could:
1. Use Twitter search API to find academics
2. Cross-reference with paper author lists
3. Verify matches manually
4. Batch add to JSON file

## Tips for Best Results

1. **Verify Handles**: Make sure the Twitter account actually belongs to the author
2. **Use Exact Names**: Match the name format used in papers
3. **Add Variations**: Some authors publish under different name formats
4. **Start Small**: Add 10-20 prominent authors in key fields
5. **Growth Over Time**: Add 5-10 new handles per week

## Expected Impact

- **Engagement**: Tweets with author tags get 3-5x more engagement
- **Retweets**: Authors often retweet when tagged
- **Community Building**: Creates connections with academic community
- **Discoverability**: Authors' followers discover your site

## File Format

The `author_twitter_handles.json` file uses this format:

```json
{
  "_comment": "Instructions and notes",
  "Author Full Name": "twitter_handle",
  "Another Author": "another_handle"
}
```

- Keys: Author name as it appears in papers
- Values: Twitter handle without @ symbol
- Matching is case-insensitive
- No @ symbol needed (added automatically)

## Current Status

- **Seed Database**: ~20 prominent AI/ML researchers
- **Selection Logic**: Prioritizes papers with tagged authors
- **Fallback**: Uses top-cited papers if no matches

## Maintenance

1. Review tweets daily to find new authors to add
2. Check for typos or incorrect handles
3. Remove inactive or deleted accounts
4. Add authors from trending papers

## Future Enhancements

Potential improvements:
- Auto-suggest authors to add based on paper selection
- Integration with academic databases
- A/B testing of tweet engagement
- Author notification system
