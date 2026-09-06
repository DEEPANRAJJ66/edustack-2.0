# EDUSTACK 2.0 — COMPLETE BUILD SPECIFICATION

Build a production-ready web application called **EduStack 2.0**.

This is a completely new version of EduStack. Do not copy unnecessary features from the previous project.

The application is specifically designed for **JEE Main test practice, mock analysis, Smart Error Notes, and Error Notes PDF generation**.

The application must be clean, fast, reliable, responsive, and extremely user-friendly.

---

# 1. CORE PURPOSE

EduStack 2.0 has only these major systems:

1. Test Series
2. Mock Test Engine
3. Mock Analysis
4. Smart Error Notes
5. Error Notes PDF generation
6. Student Google authentication
7. Permanent student data storage

There is NO teacher system.

There is NO teacher login.

There is NO teacher dashboard.

There is NO question-creation UI.

Questions are maintained directly through the source code.

---

# 2. TECHNOLOGY STACK

Use the following architecture unless there is a very strong technical reason to change something:

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Modern component architecture

## Backend

* Node.js
* Express.js
* TypeScript

## Database

* Supabase
* PostgreSQL

## Authentication

* Supabase Auth
* Google OAuth

## Database ORM

* Prisma may be used for backend database access if appropriate.

If Prisma is used, configure it correctly for Supabase PostgreSQL.

## Mathematical rendering

Use:

* KaTeX
* LaTeX

The application must render mathematical content correctly everywhere.

## PDF

Use a reliable PDF-generation implementation capable of handling:

* Text
* Mathematical content
* Images
* SVG/diagram content where practical

---

# 3. CRITICAL DATA PERSISTENCE REQUIREMENT

This is one of the most important requirements.

The previous version of the application had a serious problem where data appeared to reset/disappear after approximately 45 minutes.

THIS MUST NOT HAPPEN IN EDUSTACK 2.0.

All student-related data must be stored permanently in Supabase PostgreSQL.

Never use:

* In-memory arrays as the primary database
* Temporary server memory
* Temporary deployment filesystem
* Server-local JSON files
* Temporary runtime variables for persistent student data
* Browser state as the only source of truth

The following data must persist permanently:

* Student profile
* Google authentication identity
* Test attempts
* Attempt number
* Student responses
* Question status
* Submitted answers
* Score
* Subject scores
* Correct/wrong/unattempted information
* Time information
* Mock analysis
* Smart Error Notes
* Error classifications
* Student corrections
* Error-note content
* Attempt history
* Attended status

Data must survive:

* Browser refresh
* Closing the browser
* Reopening the application
* Logout
* Login again
* Backend restart
* Server restart
* Server sleep
* Application redeployment
* Frontend redeployment

NEVER automatically reset the database when the backend starts.

NEVER run destructive database initialization on every server startup.

Database migrations must preserve existing data.

---

# 4. GOOGLE LOGIN

Students must log in using their Google account.

Use Supabase Auth with Google OAuth.

Flow:

Google Account
→ Supabase Auth
→ Student profile
→ Student data

Each Google account must map to one student identity.

When the student returns later and logs in with the same Google account, the application must retrieve their existing data.

The student must not receive a new empty profile simply because the application was redeployed.

Do not store Google passwords.

Use Supabase's authentication system.

---

# 5. DATABASE DESIGN

Design a proper relational PostgreSQL schema.

The most important relationship is:

Student
→ Test
→ Multiple Attempts
→ Responses
→ Analysis
→ Error Notes

A student can attempt the same test many times.

For example:

Mock Test 01

* Attempt 1
* Attempt 2
* Attempt 3
* Attempt 4
* etc.

Every attempt must be an independent database record.

Do NOT overwrite Attempt 1 when Attempt 2 is created.

Do NOT mix responses between attempts.

Every response must belong to a specific attempt.

Every error note must belong to a specific attempt and question.

Recommended conceptual entities:

## Student

Fields should include appropriate identifiers such as:

* id
* auth_user_id
* name
* email
* avatar/profile information if available
* created_at
* updated_at

## Test

Contains metadata:

* id
* test_id
* title
* description
* category
* duration
* total_questions
* total_marks
* published/status information
* created_at
* updated_at

Question content itself can remain in code.

## Attempt

Each time a student starts/creates an attempt, create an independent attempt record.

Fields should include:

* id
* student_id
* test_id
* attempt_number
* status
* started_at
* submitted_at
* score
* correct_count
* wrong_count
* unattempted_count
* accuracy
* total_time
* created_at
* updated_at

Attempt number must be calculated safely.

Example:

Test 01:

Attempt 1
Attempt 2
Attempt 3

## Response

Each question response belongs to one attempt.

Fields should conceptually include:

* id
* attempt_id
* question_id
* answer
* answer_type
* marked_for_review
* visited
* time_spent
* is_correct
* marks_awarded
* created_at
* updated_at

Do not allow responses from different attempts to overlap.

## ErrorNote

Should belong to:

* student
* attempt
* question

Store:

* error type
* student explanation
* correction
* concept
* formula
* prevention note
* solution information
* timestamps

## ErrorClassification

Can either be an enum or a controlled value.

Supported values:

* CONCEPT_ERROR
* DONT_KNOW_TOPIC
* FORMULA_ERROR
* CALCULATION_ERROR
* SILLY_MISTAKE
* TIME_PRESSURE
* GUESS
* OTHER
* THIS_IS_FINE

---

# 6. TEST DATA MUST BE MAINTAINED THROUGH CODE

There must be no teacher dashboard.

All questions will be written and maintained in source code.

Organize test data cleanly.

Example:

src/

data/

tests/

mock-01/

test.ts

questions.ts

assets/

images/

svg/

mock-02/

test.ts

questions.ts

assets/

images/

svg/

mock-03/

...

Each test should have its own configuration and questions.

A question should support fields conceptually similar to:

* id
* subject
* chapter
* topic
* question type
* question content
* options
* correct answer
* numerical answer
* marks
* negative marks
* solution
* images
* SVG
* LaTeX/KaTeX content

Do not duplicate question data unnecessarily.

Use stable question IDs.

---

# 7. TEST CATEGORIES AND FOLDERS

Tests must be organized in user-friendly folders/categories.

For example:

JEE Main Mock Tests

Physics

Chemistry

Mathematics

Additional test categories can be added through code.

The student dashboard should visually represent these as expandable/collapsible folders.

Example:

JEE Main Mock Tests                         >

When the student clicks the small arrow:

JEE Main Mock Tests                         ˅

```
Mock Test 01
Mock Test 02
Mock Test 03
Mock Test 04
```

The arrow should clearly communicate:

> = closed

˅ = opened

Do not make the interface complicated.

---

# 8. AVAILABLE TESTS

Create an Available Tests section.

This contains tests that the student has not yet submitted.

Example:

AVAILABLE TESTS

JEE Main Mock Tests                         ˅

```
Mock Test 01       NOT ATTENDED
Mock Test 02       NOT ATTENDED
Mock Test 03       NOT ATTENDED
```

The status must come from persistent student data.

Do not rely only on React state.

---

# 9. ATTENDED TESTS

Create a separate Attended Tests section.

After a student successfully submits a test, that test must appear under Attended Tests.

Example:

ATTENDED TESTS                         ˅

```
JEE Main Mock Test 01              ˅
JEE Main Mock Test 02              ˅
```

The student must be able to access previous attempts.

---

# 10. MULTIPLE ATTEMPTS — CRITICAL REQUIREMENT

The same test must be reusable.

A student can retake the same test multiple times.

Example:

ATTENDED TESTS

JEE Main Mock Test 01                         ˅

```
#1 First Attempt

#2 Second Attempt

#3 Third Attempt

#4 Fourth Attempt
```

Use a small arrow beside the test.

When the student clicks the arrow, expand the attempt list.

When the student clicks the test again, collapse it.

This interaction should be similar to familiar educational platforms and should feel natural.

---

# 11. ATTEMPT-SPECIFIC DATA

This is extremely important.

Suppose:

Mock Test 01

Attempt 1 score = 120

Attempt 2 score = 155

Attempt 3 score = 175

Each attempt must retain its own:

* Responses
* Answers
* Score
* Correct questions
* Wrong questions
* Unattempted questions
* Time spent
* Mock Analysis
* Error Notes
* PDF data

If the student opens Attempt 2, show ONLY Attempt 2 information.

Never accidentally display Attempt 1 responses while viewing Attempt 2.

Never overwrite Attempt 1 when creating Attempt 2.

---

# 12. ATTEMPT DETAILS UI

When the student clicks an attempt, show a clean attempt details area.

Example:

#2 Second Attempt

Score: 155 / 300

Accuracy: 82%

[ Mock Analysis ]

[ Error Notes ]

[ Generate PDF ]

[ Retake Test ]

The UI should make it obvious:

Test:
JEE Main Mock Test 01

Attempt:
Second Attempt

---

# 13. RETAKE TEST

The student must be able to retake an attended test.

Click:

RETAKE TEST

Create a NEW attempt.

If the student already has:

Attempt 1
Attempt 2
Attempt 3

the next attempt becomes:

Attempt 4

Do not modify previous attempts.

---

# 14. MCQ QUESTIONS

Support JEE-style MCQ questions.

Each MCQ should support:

* Four options
* One correct answer
* Positive marks
* Negative marks
* Selected option
* Mark for Review
* Answer status

The UI should clearly indicate selected answers.

---

# 15. NUMERICAL ANSWER TYPE QUESTIONS

Support Numerical Answer Type questions.

This is a mandatory requirement.

The student must manually enter the numerical answer.

The numerical input box must allow ONLY:

0–9

and:

.

Examples accepted:

5

10

5.25

0.5

125.75

Examples rejected:

12a

5+2

5-2

5/2

abc

12 50

12%

Any other character

The restriction must happen WHILE THE STUDENT IS TYPING.

Invalid characters should not remain in the input.

Do not simply validate after submission.

The input itself must prevent invalid characters.

Also handle paste input safely.

The frontend validation and backend validation should both exist.

---

# 16. JEE MAIN TEST INTERFACE

Build a professional CBT-style interface.

Include:

* Test header
* Timer
* Subject/question navigation
* Question number
* Question content
* Answer area
* Save & Next
* Previous
* Clear Response
* Mark for Review
* Question palette
* Status indicators
* Submit button

Make the interface easy to understand.

Do not overload the screen with unnecessary elements.

---

# 17. TIMER

The test has a fixed duration.

Default:

3 hours.

The timer must be reliable.

Do not rely solely on a JavaScript interval that can become incorrect after browser throttling.

Store appropriate timestamps.

Calculate remaining time from persisted start time and server/application time logic.

If the browser refreshes during an active attempt, the remaining time should be reconstructed correctly.

Do not reset the timer on refresh.

---

# 18. AUTO-SAVE / RESPONSE PERSISTENCE

Student responses should be saved reliably.

Do not keep important responses only in React state.

When appropriate, save:

* Selected MCQ answer
* Numerical answer
* Mark for Review
* Question state
* Time spent

Use efficient debounced saving where appropriate.

Avoid excessive database writes.

If the browser refreshes, the active attempt should recover correctly according to the application's intended test rules.

---

# 19. QUESTION STATUS

The question palette should clearly distinguish:

* Not visited
* Answered
* Not answered
* Marked for Review
* Answered + Marked for Review

Use intuitive visual indicators.

---

# 20. MOCK SUBMISSION

When the student submits:

1. Validate the attempt.
2. Calculate score.
3. Calculate correct count.
4. Calculate wrong count.
5. Calculate unattempted count.
6. Calculate accuracy.
7. Calculate subject-wise performance.
8. Store the final attempt permanently.
9. Mark the test as attended for that student.
10. Make the attempt visible under Attended Tests.
11. Make Mock Analysis available.
12. Make Smart Error Notes available.

---

# 21. MOCK ANALYSIS

Every attempt must have its own analysis.

Show:

* Total score
* Maximum score
* Physics score
* Chemistry score
* Mathematics score
* Correct count
* Wrong count
* Unattempted count
* Accuracy
* Time spent
* Question-wise result

Also show student answer vs correct answer.

Example:

Question 12

Your Answer: B

Correct Answer: C

Status: Wrong

Time Spent: 2m 15s

---

# 22. SMART ERROR NOTES

From Mock Analysis, the student should be able to identify wrong questions and create Smart Error Notes.

For each wrong question, provide an error classification UI.

Supported categories:

1. Concept Error
2. Don't Know Topic
3. Formula Error
4. Calculation Error
5. Silly Mistake
6. Time Pressure
7. Guess
8. Other
9. This is Fine

Make the interface simple.

Use checkboxes, radio buttons, or another clear selection mechanism.

Allow the student to write:

* What went wrong?
* Why did I make this mistake?
* Correct concept
* Correct formula
* How will I avoid this next time?
* Personal correction

---

# 23. "THIS IS FINE"

"This is Fine" is a special classification.

If selected:

* The question should not be treated as a meaningful error.
* It should be excluded from error-related processing.
* It should still remain part of the attempt history.
* It must not be deleted from the student's original response data.

---

# 24. ERROR NOTE AUTO-SAVE

Error Notes must be saved persistently.

Do not lose notes when:

* Refreshing the page
* Navigating away
* Closing the browser
* Returning later
* Logging out
* Logging in again

Use appropriate debounced auto-save or explicit save behavior.

Show a clear saved state when appropriate.

---

# 25. ERROR NOTE CONTENT

An error note should be able to contain:

* Original question
* Student answer
* Correct answer
* Error type
* Student explanation
* Correct concept
* Formula
* Correct solution
* Revision note
* Images where applicable
* Mathematical notation

Render LaTeX/KaTeX properly.

---

# 26. ERROR NOTES PDF

Provide:

GENERATE ERROR NOTES PDF

The generated PDF must contain information for the selected test attempt.

Include:

* Student name
* Test name
* Attempt number
* Score
* Error statistics
* Question
* Student answer
* Correct answer
* Error classification
* Student's notes
* Correct solution
* Images
* Mathematical formulas
* SVG/diagram information where supported

The PDF should look like a proper revision/error notebook.

Use clear sections and spacing.

Do not produce a broken PDF with overlapping text.

---

# 27. PDF MUST BE ATTEMPT-SPECIFIC

If the student generates a PDF from:

Mock Test 01
Attempt 2

the PDF must contain only Attempt 2's error notes.

Never accidentally combine Attempt 1 and Attempt 2.

---

# 28. LATEX / KATEX RENDERING

This is mandatory.

JEE questions commonly contain mathematical notation.

Support:

* Fractions
* Powers
* Roots
* Integrals
* Limits
* Summations
* Matrices
* Vectors
* Greek letters
* Subscripts
* Superscripts
* Trigonometric expressions
* Equations
* Physics formulas
* Chemistry equations

Use KaTeX for fast browser rendering.

Question data may contain LaTeX.

Example:

\(\frac{x^2+1}{x-1}=5\)

Render it as mathematics.

Never display raw LaTeX to the student unless the content intentionally contains plain text.

---

# 29. SVG SUPPORT

Questions and solutions may contain SVG diagrams.

Support SVG safely.

SVG may be used for:

* Physics diagrams
* Graphs
* Geometry
* Circuits
* Coordinate diagrams
* Chemistry diagrams
* Mathematical figures

Do not break the question layout when SVG is present.

---

# 30. IMAGE SUPPORT

Questions and solutions may contain images.

The architecture should allow test assets to be stored alongside the test code.

Example:

tests/

mock-01/

assets/

images/

svg/

Images must render correctly in:

* Test interface
* Mock Analysis
* Error Notes
* PDF generation

---

# 31. FRONTEND USER EXPERIENCE

The application must be extremely user-friendly.

The student should always understand:

* Which test they are viewing
* Whether they have attended it
* Which attempt they selected
* Their score
* Where their analysis is
* Where their error notes are
* How to retake the test

Avoid unnecessary navigation.

Preferred structure:

Test Folder
→ Test
→ Attempts
→ Select Attempt
→ Analysis / Error Notes / PDF / Retake

---

# 32. RESPONSIVE DESIGN

The application should work well on:

* Desktop
* Laptop
* Tablet
* Mobile

The actual CBT experience should prioritize desktop/laptop while still being responsive.

Do not allow mobile layouts to become unusable.

---

# 33. UI DESIGN

Use a clean modern educational interface.

Prioritize:

* Readability
* Clear hierarchy
* Consistent spacing
* Clear buttons
* Accessible contrast
* Smooth expandable folders
* Clear attempt labels
* Clear status indicators
* Professional cards/panels

Avoid excessive animations.

Performance is more important than decorative effects.

---

# 34. PERFORMANCE

EduStack 2.0 should feel fast.

Avoid:

* Unnecessary re-renders
* Repeated database requests
* Huge client-side state objects
* Loading every test question at once if unnecessary
* Repeated API calls

Use:

* Lazy loading
* Proper caching where appropriate
* Efficient queries
* Debounced writes
* Pagination where useful

---

# 35. SECURITY

Never expose sensitive server credentials in the frontend.

Use environment variables.

Never expose:

* Supabase service-role key
* Database password
* Server secrets

The browser should use only the appropriate public Supabase configuration.

Server-only credentials must remain on the server.

Validate all incoming API data.

Do not trust frontend score calculations blindly.

The backend should validate important submitted data.

---

# 36. SUPABASE SECURITY

Use appropriate Row Level Security policies.

Students must only be able to access their own:

* Profile
* Attempts
* Responses
* Error Notes
* Analysis data

Student A must NEVER be able to read Student B's attempts.

Student A must NEVER be able to modify Student B's responses.

Use the authenticated Supabase user identity to enforce ownership.

---

# 37. DATABASE RELATIONSHIPS

Design proper foreign keys.

Conceptually:

Student
1 → many Attempts

Test
1 → many Attempts

Attempt
1 → many Responses

Attempt
1 → many Error Notes

Question
1 → many Responses across attempts

Question
1 → many Error Notes across attempts

Ensure deletion/update behavior is intentional.

Do not accidentally cascade-delete an entire student's history.

---

# 38. ATTEMPT NUMBERING

Attempt numbers must be sequential per student + test.

Example:

Student A:

Test 01

Attempt 1
Attempt 2
Attempt 3

Student B:

Test 01

Attempt 1

Student B must NOT receive Attempt 4 simply because Student A has already attempted it three times.

Attempt numbering is scoped to the student and test.

Make this concurrency-safe.

---

# 39. ATTENDED STATUS

Do not simply store a permanent boolean without considering attempt history.

The UI should derive whether a student has attended a test based on their persisted submitted attempts.

If at least one completed/submitted attempt exists:

ATTENDED

If none exists:

NOT ATTENDED

The student can still retake an attended test.

---

# 40. IMPORTANT DISTINCTION

A TEST and an ATTEMPT are NOT the same thing.

Test:

JEE Main Mock Test 01

Attempt:

Student's individual execution of that test.

Never combine these concepts in the database.

This distinction is essential for the entire architecture.

---

# 41. ERROR NOTE RELATIONSHIP

Error Notes must belong to a specific attempt.

Example:

Mock Test 01

Attempt 1
→ Error Note for Q5

Attempt 2
→ Error Note for Q5

These are two different error notes.

Never overwrite Attempt 1's error note when Attempt 2 creates another one.

---

# 42. PREVIOUS ATTEMPT HISTORY

The student should be able to see all attempts.

Example:

JEE Main Mock Test 01

˅

#1 First Attempt
#2 Second Attempt
#3 Third Attempt
#4 Fourth Attempt

Do not hide previous attempts.

Do not replace the old attempt with the newest attempt.

---

# 43. RETAKE UX

When the student chooses Retake Test:

Show an appropriate confirmation.

Then create a new attempt.

Do not delete previous history.

The new attempt gets its own:

* Start time
* Responses
* Score
* Analysis
* Error Notes

---

# 44. NO TEACHER FEATURES

Do not build:

* Teacher authentication
* Teacher dashboard
* Teacher question creator
* Teacher test builder
* Teacher management UI

Questions are code-managed.

---

# 45. PROJECT STRUCTURE

Use a maintainable project structure.

Example:

src/

components/

pages/

layouts/

data/

tests/

mock-01/

test.ts

questions.ts

assets/

images/

svg/

mock-02/

...

features/

auth/

test-engine/

analysis/

error-notes/

pdf/

services/

supabase/

utils/

types/

hooks/

Keep business logic separated from UI components.

---

# 46. ENVIRONMENT VARIABLES

Use environment variables for configuration.

Example conceptual variables:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

SERVER_DATABASE_URL

SERVER_DIRECT_DATABASE_URL

Do not hard-code secrets.

Create a safe `.env.example`.

Never commit real secrets.

---

# 47. DEPLOYMENT ARCHITECTURE

Recommended deployment:

Frontend:

Vercel

Backend:

Render

Database:

Supabase PostgreSQL

Authentication:

Supabase Auth

Architecture:

React/Vite
↓
Vercel

Node/Express
↓
Render

PostgreSQL/Auth
↓
Supabase

The database must remain independent from the backend deployment.

A Render restart must NOT delete student data.

A Vercel redeployment must NOT delete student data.

---

# 48. DEPLOYMENT SAFETY

Before deployment, verify:

* Database migrations are safe.
* No startup code resets tables.
* No seed script destroys production data.
* No temporary filesystem is used for student persistence.
* Environment variables are configured correctly.
* Supabase RLS policies are enabled.
* Google OAuth redirect URLs are configured.
* Production database is separate from local development database where appropriate.

---

# 49. TESTING REQUIREMENTS

Before considering the project complete, test:

### Authentication

* Google login
* Logout
* Login again
* Same student restored

### Persistence

* Submit test
* Refresh
* Close browser
* Reopen
* Login again
* Data still exists

### Attempts

* Take Test 01
* Submit
* Retake
* Submit again
* Retake a third time
* Verify Attempt 1, 2 and 3 are all independent

### Responses

Change answers in Attempt 2.

Verify Attempt 1 remains unchanged.

### Error Notes

Create notes for Attempt 1.

Create different notes for Attempt 2.

Verify they remain independent.

### Numerical Input

Attempt invalid characters.

Verify they are blocked immediately.

Test typing and paste.

### Timer

Refresh during an active test.

Verify timer does not reset incorrectly.

### PDF

Generate PDF from Attempt 2.

Verify it contains only Attempt 2 information.

### Deployment

Restart backend.

Verify student data remains.

Redeploy.

Verify student data remains.

---

# 50. DEVELOPMENT APPROACH

Do NOT generate a huge amount of broken code at once.

Build in logical phases.

PHASE 1:
Project foundation and UI architecture.

PHASE 2:
Supabase configuration and Google authentication.

PHASE 3:
Database schema and migrations.

PHASE 4:
Code-based test/question architecture.

PHASE 5:
Test Series UI and collapsible folders.

PHASE 6:
CBT test engine.

PHASE 7:
MCQ and Numerical Answer Type support.

PHASE 8:
LaTeX/KaTeX/SVG/image rendering.

PHASE 9:
Persistent responses and timer.

PHASE 10:
Submission and scoring.

PHASE 11:
Mock Analysis.

PHASE 12:
Smart Error Notes.

PHASE 13:
Error Notes PDF.

PHASE 14:
Multiple attempts and attempt-history UX.

PHASE 15:
Security and RLS.

PHASE 16:
Testing.

PHASE 17:
Production deployment.

Do not move to the next major phase until the previous phase is working correctly.

---

# 51. MOST IMPORTANT ARCHITECTURAL RULES

Remember these rules throughout the project:

1. Supabase is the permanent source of truth for student data.

2. Never use temporary memory as the permanent database.

3. A Test is different from an Attempt.

4. One student can have unlimited attempts for one test.

5. Every attempt is independent.

6. Every response belongs to an attempt.

7. Every error note belongs to an attempt.

8. Previous attempts must never be overwritten.

9. Google authentication must identify the same student consistently.

10. Refresh/redeployment must never erase student data.

11. Numerical input accepts only numbers and decimal point.

12. Invalid numerical characters must be blocked while typing and on paste.

13. Questions are maintained through code.

14. There is no teacher dashboard.

15. LaTeX/KaTeX rendering is mandatory.

16. SVG and image support is mandatory.

17. Error Notes PDF must be attempt-specific.

18. Attended tests remain reusable.

19. Attempt history must be expandable using a small arrow.

20. The interface must prioritize simplicity and user-friendliness.

---

# 52. FINAL USER EXPERIENCE

The final student experience should feel like this:

LOGIN

↓
Google Account

↓
STUDENT DASHBOARD

↓
AVAILABLE TESTS

↓
Expand folder using small arrow

↓
Select Mock Test

↓
ATTEMPT JEE MAIN MOCK

↓
Submit

↓
ATTENDED TESTS

↓
Expand Mock Test

↓
#1 First Attempt
#2 Second Attempt
#3 Third Attempt

↓
Select an Attempt

↓
Mock Analysis

↓
Smart Error Notes

↓
Generate Error Notes PDF

↓
Retake Test

↓
Create another independent attempt

---

# 53. FINAL SUCCESS CRITERIA

EduStack 2.0 is successful only when:

* A student can Google-login.
* Student data is permanently stored in Supabase.
* Tests are organized through code.
* Students see expandable test folders.
* Students can take MCQ and numerical questions.
* Numerical input strictly accepts only numbers and decimal point.
* LaTeX/KaTeX renders correctly.
* SVG and images render correctly.
* Test responses are persisted.
* Test submission works.
* Mock Analysis works.
* Smart Error Notes work.
* Error Notes PDF works.
* Students can retake tests.
* Multiple attempts are stored independently.
* Attempts are displayed under expandable tests.
* Previous attempts remain accessible.
* Refresh does not erase data.
* Logout/login does not erase data.
* Backend restart does not erase data.
* Deployment does not erase data.
* No teacher system exists.
* The overall UI is simple and user-friendly.

Build this as a real production-quality application, not merely a visual prototype.

Before writing large amounts of code, establish the architecture, database schema, folder structure, authentication flow, and data relationships correctly.

Do not sacrifice data persistence or attempt-history correctness for speed of implementation.
