# Yawa Khim websites

This project contains three static websites in a single folder:

- The parent brand at `/`
- Yawa Mart at `/mart.html`
- Yawa Khim Hotel & Restaurant at `/hotel.html`

The pages use plain HTML, CSS, and lightweight vanilla JavaScript. No build step, Node.js, npm, URL rewriting, or `.htaccess` file is required.

## Project structure

```text
Website/
  index.html
  favicon.svg
  site.css
  site.js
  mart.html
  mart.css
  mart.js
  hotel.html
  hotel.css
  hotel.js
```

## Run locally with XAMPP

1. Copy the project folder into XAMPP's `htdocs` directory. For the URLs below, the folder should be named `Website`.
2. Open the XAMPP Control Panel and start **Apache**.
3. Visit:
   - `http://localhost/Website/`
   - `http://localhost/Website/mart.html`
   - `http://localhost/Website/hotel.html`

The navigation and assets use relative paths, so the same files also work when deployed together in the domain's document root.

## Deploy to yawakhim.com.np

Upload all files in this project to the domain's document root. The intended public paths are:

- `https://yawakhim.com.np/`
- `https://yawakhim.com.np/mart.html`
- `https://yawakhim.com.np/hotel.html`

No separate subdomains are used.

## Before publishing

The supplied contact details are shown on the sites: `9812300300` and `yawakhim80@gmail.com`. The Mart location is listed as Sankhadar Chowk, Damak; the Hotel & Restaurant location is listed as Hawaldar Chowk, Damak. Replace the remaining visibly marked placeholders with confirmed opening/restaurant hours and social accounts. Confirm the Mart's current product selection and the Hotel & Restaurant's actual offerings directly with the business. The Hotel contact section opens an email enquiry; it does not accept or confirm reservations.
