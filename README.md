# uNdoqo-v1

Some potential branches:

main
│
├── uNdoqo-Phase-1 ( done )
├── uNdoqo-Phase-2 ( current )
├── media-module
├── consultation-portal
├── archive-database
└── mobile-version

=========================================

When Phase 1 is stable

Switch to main:

git checkout main

Pull latest:

git pull origin main

Merge:

git merge uNdoqo-Phase-1

Push:

git push origin main

Even better for your project

Create branches by feature:

uNdoqo-Phase-1
feature-homepage
feature-courses
feature-consultations
feature-bookstore
feature-media-gallery
feature-archive

This makes it easy to roll back a feature if something breaks.

Next step for the website

Your current structure is already growing beyond a single-page prototype.

I would now refactor to:

Website/
│
├── index.html
│
├── pages/
│   ├── about.html
│   ├── courses.html
│   ├── consultations.html
│   ├── media.html
│   ├── bookstore.html
│   └── contact.html
│
├── css/
│   ├── styles.css
│   ├── home.css
│   ├── courses.css
│   └── media.css
│
├── js/
│   ├── main.js
│   ├── courses.js
│   └── media.js
│
├── assets/
│   ├── STU_logo.png
│   ├── tree_sun_rays_move.mp4
│   ├── images/
│   └── icons/
│
└── README.md

This will make the project much easier to maintain when you start adding:

Course enrollment
Consultation bookings
Archive database
Media gallery
User accounts
Payment integration
Admin dashboard

Those are the natural next phases for the uNdoqo platform.

================================

Commit This Refactor
git add .
git commit -m "Refactor site into multi-page architecture"
git push origin uNdoqo-Phase-1

After this, the next milestone is turning the static pages into a proper web application by adding:

Course enrollment forms
Consultation booking forms
Media gallery with embedded YouTube/TikTok
Bookstore catalog
PostgreSQL-ready data structure
Admin dashboard

Those will move the project from a website into the first version of the actual uNdoqo platform.