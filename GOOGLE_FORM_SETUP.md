# Digital Notice Board — Google Form Survey Setup Guide

This guide details how to create and deploy the **Student Requirement & Feedback Survey** using the 10 questions specified in **Appendix A** of the Project Report.

---

## 🚀 Option 1: Instant 1-Click Creation via Google Apps Script (Recommended)

You can automatically generate the complete Google Form inside your own Google Drive in under 30 seconds:

1. Open **[script.google.com](https://script.google.com/)** in your browser.
2. Click **"+ New Project"**.
3. Clear the default code and copy-paste the entire contents of **[`Google_Forms_Apps_Script.js`](Google_Forms_Apps_Script.js)** into `Code.gs`.
4. Click **Save (💾)** and then click **Run (▶)**.
5. Grant permissions to allow Google Apps Script to create the form in your Google Drive.
6. The **Execution Log** at the bottom will display:
   * **Edit URL**: Direct link to edit/customize your form in Google Drive.
   * **Live Public URL**: Direct shareable link to send to students and classmates.

---

## 📋 Option 2: Manual Google Form Setup

If you prefer setting up the form manually at **[forms.google.com](https://forms.google.com/)**:

### Form Header
* **Form Title**: `Digital Notice Board - Student Requirement & Feedback Survey`
* **Form Description**:
  ```
  Community Engagement Project Survey on College Notice Dissemination & Digital Notice Board App
  Department of Computer Science | Academic Year 2025-26
  ```

---

### Survey Questions (From Appendix A)

| # | Question Title | Question Type | Options / Choices | Required? |
|---|---|---|---|---|
| **1** | How do you currently get college updates and notices? | Checkboxes | • Physical Posters / Campus Notice Boards<br>• WhatsApp Groups / Class Broadcasts<br>• Official College Website<br>• Word of mouth from friends/faculty<br>• *[Other...]* | **Yes** |
| **2** | What information do you need most frequently? | Checkboxes | • Exam & Assignment Deadlines<br>• College Events & Workshops<br>• Grades, Hall Tickets & Academic Results<br>• Fee Schedules & Administrative Notices<br>• *[Other...]* | **Yes** |
| **3** | Would push notifications help you stay updated? | Multiple choice | • Yes - Very helpful<br>• Maybe - Depends on frequency<br>• No - Prefer to check manually | **Yes** |
| **4** | Do you prefer a mobile app or a website for notices? | Multiple choice | • Mobile App (Instant notifications, offline access)<br>• Website (Accessible from any browser)<br>• Both (Progressive Web App - installable website) | **Yes** |
| **5** | How often do you currently check college notices? | Multiple choice | • Daily<br>• Weekly<br>• Rarely / Only when reminded by peers | **Yes** |
| **6** | What prevents you from checking physical notices regularly? | Checkboxes | • Physical notice boards are crowded or not easily visible<br>• Notices are outdated, torn, or cluttered with old flyers<br>• Information is hard to find / scattered across multiple locations<br>• *[Other...]* | **Yes** |
| **7** | Are automated deadline alerts and reminders needed? | Multiple choice | • Yes - Critical to avoid missing dates<br>• No - Not necessary | **Yes** |
| **8** | Would you use a centralized Digital Notice Board system if launched? | Multiple choice | • Definitely - Would use immediately<br>• Maybe - Would try it out<br>• No - Prefer current methods | **Yes** |
| **9** | What is the best time to receive notification summaries? | Multiple choice | • Morning (8:00 AM)<br>• Afternoon (1:00 PM)<br>• Evening (6:00 PM) | **Yes** |
| **10** | Do you have any suggestions or features you would like to see in the app? | Paragraph | *(Open text response for student feedback, category filters, attachment suggestions)* | *No* |

---

## 📊 Connecting Responses to Google Sheets

To automatically collect responses in a spreadsheet (as referenced in Section 11.1 of the Project Report):

1. Open your created Google Form.
2. Click on the **Responses** tab at the top.
3. Click the green **Link to Sheets** icon.
4. Choose **"Create a new spreadsheet"** and name it `Digital Notice Board - Survey Responses`.
5. Every student submission will immediately populate as a new row in real-time.
