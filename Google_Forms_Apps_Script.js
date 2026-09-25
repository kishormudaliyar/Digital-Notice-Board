/**
 * Google Apps Script to Automatically Create the Digital Notice Board Survey
 * 
 * Instructions:
 * 1. Open https://script.google.com/ in your browser (logged into your Google Account).
 * 2. Click "New Project".
 * 3. Replace the code in Code.gs with this entire script.
 * 4. Click "Save" (Ctrl+S) and then click "Run" (▶).
 * 5. Grant permissions when prompted.
 * 6. View the Execution Log at the bottom to get your Form URL and Edit URL!
 */

function createDigitalNoticeBoardSurvey() {
  // Create a new Google Form in your Google Drive
  var form = FormApp.create('Digital Notice Board - Student Requirement & Feedback Survey');
  
  // Configure form metadata
  form.setDescription(
    'Community Engagement Project Survey on College Notice Dissemination & Digital Notice Board App\n' +
    'Department of Computer Science | Academic Year 2025-26\n\n' +
    'Please take 2 minutes to provide feedback on how you receive college notices and announcements.'
  );
  form.setConfirmationMessage('Thank you for completing the survey! Your responses will help improve college communications.');
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);
  form.setShowLinkToRespondAgain(false);

  // Question 1: Current Channels (Checkboxes)
  var q1 = form.addCheckboxItem();
  q1.setTitle('1. How do you currently get college updates and notices?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'Physical Posters / Campus Notice Boards',
      'WhatsApp Groups / Class Broadcasts',
      'Official College Website',
      'Word of mouth from friends/faculty'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Question 2: Information Need (Checkboxes)
  var q2 = form.addCheckboxItem();
  q2.setTitle('2. What information do you need most frequently?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'Exam & Assignment Deadlines',
      'College Events & Workshops',
      'Grades, Hall Tickets & Academic Results',
      'Fee Schedules & Administrative Notices'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Question 3: Push Notifications (Multiple Choice)
  var q3 = form.addMultipleChoiceItem();
  q3.setTitle('3. Would push notifications help you stay updated?')
    .setChoiceValues([
      'Yes - Very helpful',
      'Maybe - Depends on frequency',
      'No - Prefer to check manually'
    ])
    .setRequired(true);

  // Question 4: Platform Preference (Multiple Choice)
  var q4 = form.addMultipleChoiceItem();
  q4.setTitle('4. Do you prefer a mobile app or a website for notices?')
    .setChoiceValues([
      'Mobile App (Instant notifications, offline access)',
      'Website (Accessible from any browser)',
      'Both (Progressive Web App - installable website)'
    ])
    .setRequired(true);

  // Question 5: Checking Frequency (Multiple Choice)
  var q5 = form.addMultipleChoiceItem();
  q5.setTitle('5. How often do you currently check college notices?')
    .setChoiceValues([
      'Daily',
      'Weekly',
      'Rarely / Only when reminded by peers'
    ])
    .setRequired(true);

  // Question 6: Obstacles / Pain Points (Checkboxes)
  var q6 = form.addCheckboxItem();
  q6.setTitle('6. What prevents you from checking physical notices regularly?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'Physical notice boards are crowded or not easily visible',
      'Notices are outdated, torn, or cluttered with old flyers',
      'Information is hard to find / scattered across multiple locations'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Question 7: Deadline Alerts (Multiple Choice)
  var q7 = form.addMultipleChoiceItem();
  q7.setTitle('7. Are automated deadline alerts and reminders needed?')
    .setChoiceValues([
      'Yes - Critical to avoid missing dates',
      'No - Not necessary'
    ])
    .setRequired(true);

  // Question 8: Adoption Likelihood (Multiple Choice)
  var q8 = form.addMultipleChoiceItem();
  q8.setTitle('8. Would you use a centralized Digital Notice Board system if launched?')
    .setChoiceValues([
      'Definitely - Would use immediately',
      'Maybe - Would try it out',
      'No - Prefer current methods'
    ])
    .setRequired(true);

  // Question 9: Notification Timing (Multiple Choice)
  var q9 = form.addMultipleChoiceItem();
  q9.setTitle('9. What is the best time to receive notification summaries?')
    .setChoiceValues([
      'Morning (8:00 AM)',
      'Afternoon (1:00 PM)',
      'Evening (6:00 PM)'
    ])
    .setRequired(true);

  // Question 10: Feedback / Suggestions (Paragraph)
  var q10 = form.addParagraphTextItem();
  q10.setTitle('10. Do you have any suggestions or features you would like to see in the app?')
     .setHelpText('Optional: Share any ideas (e.g. search filters, department categories, attachments).')
     .setRequired(false);

  // Output URLs in logger
  var publishedUrl = form.getPublishedUrl();
  var editUrl = form.getEditUrl();

  Logger.log('====================================================');
  Logger.log('🎉 Google Form created successfully!');
  Logger.log('📝 Edit Form URL: ' + editUrl);
  Logger.log('🔗 Live Public Form URL: ' + publishedUrl);
  Logger.log('====================================================');
}
