### **Product Requirements Document: PicStream**

**App Name:** **PicStream**
**Version:** 1.0 (MVP)
**Date:** [Current Date]
**Author(s):** [Your Name]

---

### **1. Introduction & Vision**

**1.1. Executive Summary:**
PicStream is a web-based platform designed to help friends and family easily share photos and videos from shared events in their original, full quality. It replaces compressed, chaotic sharing in text message groups with temporary, collaborative albums.

**1.2. Problem Statement:**
After a shared experience like a vacation, wedding, or party, groups struggle to consolidate their photos. Sharing through text messages heavily compresses media, ruining the quality. Existing cloud storage solutions are clunky for this purpose, create permanent digital clutter, and often require everyone to have the same app installed. There is no simple, event-based solution for temporary, high-quality media sharing that works seamlessly on the web.

**1.3. Vision & Proposed Solution:**
Our vision is to make sharing memories as high-quality and effortless as creating them. PicStream provides a simple web platform where a user can create a temporary, collaborative album. Friends are invited via a single, private link. Upon joining, they can upload their own photos and download anyone's contributions in full, original resolution. All content is automatically deleted after a set period, ensuring privacy and simplicity.

---

### **2. Target Audience & User Personas**

*(This section remains unchanged.)*

---

### **3. Features & User Stories**

**3.1. Core Features (MVP - Must-Haves for Version 1.0):**

**Feature: Passwordless Authentication**
*   **US-101:** As a new or returning user, I want to enter my email address to receive a one-time login link, so I don't have to remember a password.
*   **US-102:** As a user, I want to click the "magic link" in my email to be automatically and securely logged into the web app.
*   **Design Note:** The user's session will persist for 30 days via a secure cookie.

**Feature: Album Management**
*   **US-201:** As an organizer, I want to create a new album by giving it a title.
*   **US-202:** As an organizer, I want to set an expiration date for my album from a set of options (**14, 30, or 60 days**), with **30 days** selected by default.
*   **US-203:** As a user, I want to see a list of all active albums I have created or joined on my main dashboard.
*   **US-204:** As the album organizer (Admin), I want the ability to delete any photo or video from the album.
*   **US-205:** As a user, I want to be able to delete photos and videos that I have personally uploaded.
*   **US-206:** As a user who clicks a link to an expired album, I want to see a clear page stating, "This album has expired and its contents are no longer available."
*   **US-207:** As an organizer, when I create a new, empty album, I want to see a clear message and prominent buttons guiding me to either "Upload Photos" or "Share Invite Link."
*   **Design Note:** All delete actions (US-204, US-205) will trigger a simple confirmation dialog (e.g., "Are you sure you want to permanently delete this item?") to prevent accidental removal.

**Feature: Media Upload**
*   **US-301:** As any user in an album, I want to select multiple photos and videos from my device to upload.
*   **US-302:** As any user, I want to see an upload progress indicator for my files.
*   **Technical Requirement 1 (Thumbnail Generation):** Upon upload, the server will generate two compressed web-optimized versions for display, to ensure a fast user experience and low storage costs:
    *   A small `400x400px` thumbnail for the gallery grid view.
    *   A larger `1920px` (on the longest edge) preview image for the full-screen viewer.
    *   The full-resolution original file is never displayed directly but is preserved for download.
*   **Technical Requirement 2 (File Compatibility):** If a `.HEIC` file is uploaded, the server will store the original file but generate the display thumbnails/previews as `.JPG`s for universal browser compatibility.
*   **Technical Requirement 3 (File Size Limit):** The platform will enforce a maximum file size limit of **250 MB per file**.

**Feature: Album Sharing & Access**
*   **US-401:** As an organizer, I want to generate a unique, private share link for my album.
*   **US-402:** As an organizer, I want to easily copy this link to share it via text, email, or other messaging apps.
*   **US-403:** As a guest clicking a share link, I want to be prompted to log in with my email so the system can grant me access and associate the album with my account.
*   **US-404:** As a returning user, I want to see all the albums I have previously joined on my main dashboard.

**Feature: Media Download**
*   **US-501:** As a user, I want to be able to download a single photo or video in its full, original quality from the full-screen viewer.
*   **US-502:** As a user, I want to select multiple items in the gallery and download them together.
*   **Design Note:** The multi-select interaction (US-502) should be similar to Google Photos, where hovering over a thumbnail reveals a checkbox. Clicking it enters a "selection mode" allowing the user to select multiple items for download.

**3.2. Supported File Formats (MVP)**
*   **Photos:** JPEG, PNG, HEIC, GIF
*   **Videos:** MP4, MOV

**3.3. Future Features (Post-MVP)**
*   **Download All (.zip):** Provide a one-click option to download the entire album as a single compressed file.
*   **Duplicate File Detection:** Prevent users from uploading a file that already exists in the album.
*   **Monetization:** Introduce a pay-per-album model for organizers.
*   **Enhanced Privacy Controls:** Add an option for "Join Requests," where the organizer must approve new members.
*   **Admin Role Transfer:** Allow an organizer to assign admin rights to another member.
*   **Reminder Notifications:** Send an email notification to all members before an album expires.

---

### **4. Non-Functional Requirements**

*   **Performance:**
    *   The web app should load any page in under 3 seconds on a standard broadband connection.
    *   The gallery view must be sorted by the media's EXIF creation timestamp if available; otherwise, it will fall back to sorting by upload time.
    *   The gallery view should lazy-load thumbnails to ensure fast initial page load.
*   **Reliability & Recovery:**
    *   Uploads must be resilient to minor network interruptions.
    *   If an upload of a batch of files fails, the UI must provide clear feedback on which specific files failed to upload.
    *   The gallery view will update in real-time with successfully uploaded files, allowing the user to easily identify which files need to be re-attempted without having to re-upload the entire batch.
*   **Security:**
    *   All user data and media must be encrypted in transit (SSL/TLS) and at rest.
    *   Shareable links must be non-sequential and cryptographically difficult to guess.
*   **Compatibility & Responsiveness:**
    *   The web app must be fully functional on the latest two versions of major desktop browsers: **Chrome, Firefox, Safari, and Edge.**
    *   The web app must have a **fully responsive design** for a seamless experience on mobile browsers (iOS Safari, Android Chrome).

---

### **5. UI/UX Design & Wireframes**

**5.1. User Flow:**
*(This section remains unchanged.)*

**5.2. Wireframes/Mockups:**
*(This section would contain links to visual designs from a tool like Figma or Sketch.)*
*   **Key Screens & Components to Design:**
    *   Landing/Login Page
    *   Dashboard (List of Active Albums)
    *   Album Creation Screen
    *   **Empty Album State** (with clear calls-to-action)
    *   Gallery View (with Google Photos-style multi-select UI)
    *   Full-Screen Image Viewer
    *   Share Modal
    *   **Upload Progress/Failure Indicators**
    *   **Expired Album Page**

### 6. Technology Stack & Architecture
* Hosting: The web application will be hosted using Firebase Hosting.
* Database: User data and album metadata will be stored in Cloud Firestore.
* File Storage: All uploaded photos and videos will be stored in Firebase Storage buckets.
* Authentication: User identity will be managed using Firebase Authentication (specifically, the email link/passwordless sign-in method).
* Backend Logic: Server-side functions, such as automatic album expiration, thumbnail generation, and .zip file creation, will be handled by Cloud Functions for Firebase.