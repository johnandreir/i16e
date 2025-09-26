# Visual Representation of the Analyze Survey Feature

## Before (Original Survey Details Modal)

```
┌─────────────────────────────────────────────────────────────────┐
│ CSAT Feedback Details - Customer Satisfaction Survey Results   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Case Number  │ Rating │ Category │ Survey Date │ Customer  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ CASE-123     │ ⭐ 5/5  │ CSAT     │ 2023-09-20  │ John D.   │ │
│ │ CASE-124     │ ⭐ 4/5  │ CSAT     │ 2023-09-21  │ Mary S.   │ │
│ │ CASE-125     │ ⭐ 5/5  │ CSAT     │ 2023-09-22  │ Alex R.   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## After (With New Analyze Survey Button)

```
┌─────────────────────────────────────────────────────────────────┐
│ CSAT Feedback Details - Customer Satisfaction Survey Results   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Survey Analysis                    [💬 Analyze Survey]      │ │
│ │ Analyze survey feedback patterns and insights               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Case Number  │ Rating │ Category │ Survey Date │ Customer  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ CASE-123     │ ⭐ 5/5  │ CSAT     │ 2023-09-20  │ John D.   │ │
│ │ CASE-124     │ ⭐ 4/5  │ CSAT     │ 2023-09-21  │ Mary S.   │ │
│ │ CASE-125     │ ⭐ 5/5  │ CSAT     │ 2023-09-22  │ Alex R.   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## After Clicking "Analyze Survey" (Insights Panel Updates)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Insights                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Excellent Customer Satisfaction Performance                  │
│    John Andrei Reyes achieves 85% CSAT rate with an average    │
│    rating of 4.2/5. 17 satisfied customers out of 20 total    │
│    surveys.                                                     │
│    💡 Continue current practices and share successful           │
│       strategies with other team members.                      │
│                                                                 │
│ ⚠️  Dissatisfied Customer Feedback Analysis                     │
│    2 customers expressed dissatisfaction (10% of total).       │
│    1 provided specific feedback.                               │
│    💡 Review DSAT feedback for common themes. Address          │
│       recurring issues and follow up with dissatisfied        │
│       customers.                                               │
│                                                                 │
│ ℹ️  Customer Feedback Engagement                                │
│    15 of 20 customers provided detailed feedback (75%).        │
│    This provides valuable insights for improvement.            │
│    💡 Great feedback engagement! Use these insights to drive   │
│       continuous improvement.                                  │
│                                                                 │
│ ℹ️  Case Coverage Analysis                                       │
│    Surveys collected for 18 unique cases. This provides       │
│    comprehensive coverage of service interactions.            │
│    💡 Continue collecting surveys across all case types to     │
│       maintain comprehensive feedback coverage.                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Button Styling Details

The "Analyze Survey" button follows the same design pattern as the existing "Analyze SCT" button:

### Button Properties:

- **Icon**: MessageSquare (💬) from Lucide React
- **Variant**: "outline" for consistent styling
- **Size**: "sm" for compact appearance
- **Classes**: "flex items-center gap-2" for proper icon alignment
- **Position**: Top-right of the analysis section
- **Background**: Card background with border for visual hierarchy

### Layout Structure:

```
Survey Analysis Section:
├── Left Side: Title and Description
│   ├── "Survey Analysis" (font-semibold)
│   └── "Analyze survey feedback patterns and insights" (muted)
└── Right Side: Analyze Survey Button
    ├── MessageSquare Icon (💬)
    └── "Analyze Survey" Text
```

## Integration Points

### 1. Modal Component (`DetailedStatsModal.tsx`)

- Added `onAnalyzeSurvey` prop to interface
- Button only renders when prop is provided (`{onAnalyzeSurvey && ...}`)
- Positioned above survey table for immediate visibility

### 2. Parent Component (`IndexNew.tsx`)

- Created `handleAnalyzeSurvey()` function with comprehensive analysis logic
- Added `surveyAnalysisResults` state for storing results
- Updated insights aggregation to include survey analysis
- Passed handler to modal via props

### 3. User Experience Flow

1. User generates report → Sees satisfaction pie chart
2. User clicks pie segment → Modal opens with survey details
3. User sees new "Analyze Survey" button → Clicks to analyze
4. System processes survey data → Generates insights
5. Insights panel updates → Shows actionable recommendations

The feature seamlessly integrates with the existing workflow while providing powerful new analysis capabilities!
