NIRAVLE — NO-CODE ADMIN WEBSITE SYSTEM
=======================================

After the one-time Supabase setup, normal website updates are done from:
/admin.html

You can manage:
- Logo / N + star monogram
- Hero / main model image
- Brand identity image
- Packaging image
- Botanical/decorative image
- Product/model photos
- Product name
- Price in BDT
- Old/compare price
- Category
- SKU
- Badge
- Sizes
- Colors
- Description
- Published/hidden status
- Featured status
- Display order
- Main page headings and paragraphs
- Hero tagline
- Packaging copy
- Footer copy

ONE-TIME SETUP
--------------
1. Create a Supabase project.
2. Choose Singapore as Region if available/recommended for Bangladesh.
3. Open SQL Editor.
4. Paste ALL of supabase-schema.sql and click Run.
5. Authentication -> Users -> create your admin user with email/password.
6. Project Settings -> API.
7. Copy Project URL and the Publishable key (or legacy anon key).
8. Open supabase-config.js and replace:
   YOUR_SUPABASE_PROJECT_URL
   YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
9. Upload ALL files in this folder to the website/GitHub repository.
10. Open your website/admin.html and sign in.

SECURITY
--------
Never put a Supabase service_role/secret key into supabase-config.js.
The browser should use only the Project URL + Publishable/Anon key.

DAILY WORKFLOW
--------------
Product:
Admin -> Products -> Add product -> choose image -> name -> price -> category -> details -> Publish.

Logo/model:
Admin -> Brand & Images -> upload -> Save brand images.

Text:
Admin -> Page Content -> edit -> Save page content.

The public site reads the saved data automatically.
