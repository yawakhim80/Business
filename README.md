# Yawa Khim website

The site is plain HTML, CSS, and JavaScript for GitHub Pages. Supabase provides the product/room catalog, admin authentication, PostgreSQL, and image storage. The existing public pages and styles remain in place.

## Migration plan and existing features

The inspected project contains three public pages (`index.html`, `mart.html`, `hotel.html`) and a private catalog manager (`manage.html`). The public pages include responsive navigation, smooth page transitions, contact links, and product, room, and hotel special-food catalog sections. The catalog manager supports listing types and availability filters.

The previous PHP backend used one SQLite `catalog_items` table with an integer ID, a `product`/`room` type, name, description, price, local image path, availability, and creation time. The manager supported admin sign-in and adding, editing, and deleting those listings. The website had no registration flow, customer accounts, orders, categories table, search/filter, pagination, or MySQL schema to migrate.

Migration mapping:

| Existing functionality | Supabase implementation |
|---|---|
| SQLite catalog records | `public.catalog_items` PostgreSQL table |
| Admin username/password session | Supabase Auth email/password session; `public.admin_users` allowlist |
| PHP permission checks | PostgreSQL Row Level Security and `public.is_admin()` |
| Local uploaded images | Public-read, administrator-write `catalog-images` Storage bucket |
| Public products, rooms, and hotel special foods | Supabase select policy and catalog cards |

No SQL migration, live database file, or catalog records were present in the project when inspected. There is therefore no source database to import. If you have an older SQLite copy elsewhere, back it up and follow the optional import steps below.

## 1. Configure Supabase

The Supabase project URL is already set in `supabase-config.js`:

```js
export const SUPABASE_URL = 'https://owlpjjlafihuxezwtzvi.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
```

In the Supabase dashboard for **yawakhim-website** (Singapore):

1. Open **Project Settings → API Keys** (or **Data API**) and copy the project's **publishable key**. It is safe to use in browser code when RLS is correctly enabled.
2. Replace `YOUR_SUPABASE_PUBLISHABLE_KEY` in `supabase-config.js` with that publishable key. Never put a `service_role`, secret, or database password in this repository.
3. Keep the project's URL and key together in this config file; no build step or npm install is needed. The frontend loads Supabase JavaScript SDK v2 as an ES module from jsDelivr.

## 2. Create the database, policies, and image bucket

1. Open **SQL Editor** in the Supabase dashboard.
2. Run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Storage**, confirm that the `catalog-images` bucket exists. The schema creates it as public-read, limited to JPEG, PNG, and WebP files up to 5 MB.

The schema enables RLS on the application tables. Visitors can read public catalog fields and images; only authenticated IDs explicitly added to `admin_users` can change listings or upload, replace, and delete images.

### Enable hotel special-food listings

The admin manager supports a `special_food` listing type for the hotel restaurant. Before publishing these listings, run [`catalog-type-migration.sql`](./catalog-type-migration.sql) once in the Supabase SQL Editor. It extends the existing catalog type constraint (or enum) while preserving product and room listings. Special-food entries then appear in the hotel's Restaurant specials section.

The hotel page uses replaceable demo photos in the website root: `hotel-room-demo.jpg` and `hotel-dining-demo.jpg`. Replace either file with the real photo using the same filename to update the page. Demo image sources: [room](https://images.unsplash.com/photo-1611892440504-42a792e24d32) and [dining](https://images.unsplash.com/photo-1414235077428-338989a2e8c0).

## 3. Create the initial administrator

There is no public registration form. Do not add a user to `admin_users` from frontend code.

1. In Supabase **Authentication → Users**, create the admin user with the intended admin email and a strong password. Confirm the email if the project's email settings require it.
2. Copy the new user's UUID from the Users list.
3. In **SQL Editor**, run this statement, replacing the UUID with that user's ID:

   ```sql
   insert into public.admin_users (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

Only a trusted project owner can perform this setup. Ordinary authenticated users cannot insert, update, or delete administrator records. To revoke access, delete that user's row from `public.admin_users` and disable/remove the Auth user in the dashboard.

## 4. Configure Auth and test

In **Authentication → URL Configuration**:

- Set the Site URL to the deployed site, for example `https://yawakhim.com.np`.
- Add the GitHub Pages URL and local test URL to the allowed redirect URLs:
  - `https://yawakhim80.github.io/Business/**`
  - `https://yawakhim.com.np/**`
  - `http://localhost:8000/**`

The manager signs in with Supabase email/password and checks the database-backed admin allowlist before showing management tools. Supabase persists the session and refreshes it; sign-out clears it. Public account registration is not part of the existing site and is not implemented. Disable public sign-ups in Supabase Auth settings if you do not need them.

To test locally, serve the folder over HTTP (ES modules do not work reliably from `file://`). From the project folder run `python -m http.server 8000`, then open:

- `http://localhost:8000/`
- `http://localhost:8000/mart.html`
- `http://localhost:8000/hotel.html`
- `http://localhost:8000/manage.html`

Sign into the manager with the administrator account. Add a product and a room with images; verify their prices and availability on the public pages; edit them, replace an image, delete them, and sign out. Also test with a non-admin Auth account, if one exists: it must not enter the dashboard or change database rows/images. RLS continues to enforce this even if someone bypasses the UI.

## 5. Optional import from an older SQLite copy

The project currently contains no database or catalog rows to import. If you have a separate, older `catalog.sqlite`:

1. Back it up and export `catalog_items` to CSV using a SQLite browser or SQLite CLI. Preserve `id`, `type`, `name`, `description`, `price`, `is_available`, and `created_at`.
2. For each existing local image, upload the image to the Supabase `catalog-images` bucket using the admin manager (or Storage dashboard), and record the resulting object path in `image_path`. A local path such as `uploads/photo.jpg` is not a Supabase Storage object.
3. Import the rows into `public.catalog_items` using the Supabase Table Editor CSV import. Map `is_available` values `0/1` to `false/true`; let `updated_at` use its default. If importing explicit IDs, advance the identity sequence afterward:

   ```sql
   select setval(
     pg_get_serial_sequence('public.catalog_items', 'id'),
     coalesce((select max(id) from public.catalog_items), 1),
     exists (select 1 from public.catalog_items)
   );
   ```

4. Compare the imported rows and images with the backup before retiring the old copy.

## 6. Deploy to GitHub Pages

1. Commit and push the source to `yawakhim80/Business`.
2. In the repository's **Settings → Pages**, choose the intended publishing branch and folder (usually the root `/`). GitHub Pages serves the HTML files directly; no PHP, MySQL, or build step is used.
3. Verify the project page at `https://yawakhim80.github.io/Business/`. Relative asset paths work under the `/Business/` repository path.
4. Configure the Supabase Auth Site URL and allowed redirect URLs for the final domain, as described above.

## 7. Connect the Cloudflare domain

In the GitHub repository's **Settings → Pages**, enter `yawakhim.com.np` as the custom domain and complete GitHub's DNS verification. In Cloudflare DNS, add the records GitHub Pages currently specifies for that domain. For an apex domain, GitHub Pages commonly uses four A records (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`); for `www`, use a CNAME to `yawakhim80.github.io`. Keep records DNS-only while GitHub provisions HTTPS, then enable **Enforce HTTPS** in Pages. Follow the current GitHub Pages documentation if its DNS instructions differ.

## Features requiring your setup or verification

- Add the Supabase publishable key to `supabase-config.js`.
- Run `supabase/schema.sql` and create the initial admin as above.
- Configure Supabase Auth URLs and GitHub Pages/Cloudflare DNS.
- No products, rooms, images, or legacy database were present to transfer.
- Confirm actual product descriptions/prices/stock and room details/prices/availability before publishing. Room availability is informational; this site does not take reservations.
- Verify the final auth redirects, email confirmation settings, Storage, and custom-domain HTTPS in your Supabase, GitHub, and Cloudflare dashboards.
