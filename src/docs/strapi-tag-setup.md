# Setting Up Tag Collection in Strapi

This guide will help you properly set up the Tag collection in Strapi to work with the music stem upload system.

## 1. Create the Tag Collection Type

1. In your Strapi admin panel, go to **Content-Type Builder**
2. Click on **Create new collection type**
3. Set the Display name to `Tag`
4. Click **Continue**

Add the following fields:

### Field 1: Name
- Field type: Text (Short text)
- Name: `name`
- Type: Required field (toggle on)

### Field 2: Type
- Field type: Enumeration
- Name: `type`
- Values: Add these values exactly as shown (one per line)
  ```
  genre
  mood
  instrument
  ```
- Type: Required field (toggle on)

### Field 3: Track Relation (Optional)
- Field type: Relation
- Related Collection: Track
- Relation Type: Many-to-Many
- Tag has many Tracks and Track has many Tags

## 2. Set Permissions

1. Go to **Settings → Roles & Permissions → Public**
2. Find the **Tag** section and enable:
   - Find
   - FindOne
   - Count
3. Save your changes

## 3. Create Tags

You have two options for creating tags:

### Option 1: Manual Creation
1. Go to **Content Manager → Tag**
2. Click on **Create new entry**
3. Enter a tag name and select the type
4. Save the entry
5. Repeat for all desired tags

### Option 2: Run the Automated Script

We've provided a script that can create a default set of tags for you:

```
cd [your-project-directory]
node src/scripts/setup-strapi-tags.js
```

This script will automatically create common genre, mood, and instrument tags.

## 4. Test the Connection

After setting up the Tag collection and adding some tags, try using the upload page to make sure the tags are being fetched correctly:

1. Go to http://localhost:3000/upload
2. Check the browser console for tag loading information
3. Verify that the tag selectors are populated with your Strapi tags

## Troubleshooting

If you're having issues:

1. Ensure your Strapi server is running
2. Check that your NEXT_PUBLIC_STRAPI_API_URL environment variable is set correctly
3. Verify that the Tag collection structure matches the specifications above
4. Check the browser console for any error messages
5. Make sure the Public role has proper permissions for Tag access 