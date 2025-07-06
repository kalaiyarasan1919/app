import { Request, Response } from "express";

// Static responses for the chatbot
const STATIC_RESPONSES = {
  task_prioritization: [
    "For task prioritization, I recommend using the Eisenhower Matrix: urgent and important tasks first, then important but not urgent. What's your most pressing deadline right now?",
    "Try the ABCDE method: A tasks are must-do, B are should-do, C are nice-to-do. Focus on your A tasks first. Which tasks are blocking others?",
    "Consider impact vs effort. High-impact, low-effort tasks should be your priority. What would have the biggest positive impact if completed today?",
    "Look at dependencies first - complete tasks that others are waiting for. Then focus on high-value deliverables. What's blocking your team right now?"
  ],
  productivity: [
    "Try the Pomodoro Technique: 25 minutes of focused work, then 5-minute breaks. This helps maintain concentration and prevents burnout.",
    "Time-block your calendar for deep work sessions. Schedule 2-3 hour blocks for complex tasks when you're most alert.",
    "Eliminate distractions by using focus mode on your devices and setting clear boundaries with your team about availability.",
    "Batch similar tasks together to reduce context switching. Group meetings, coding sessions, and administrative work separately."
  ],
  team_collaboration: [
    "Establish clear communication channels: use chat for quick questions, email for detailed updates, and meetings for complex discussions.",
    "Set up regular check-ins (daily standups or weekly syncs) to keep everyone aligned and identify blockers early.",
    "Use a shared project management tool to maintain transparency. Everyone should know what others are working on.",
    "Encourage asynchronous communication for non-urgent matters to respect everyone's focus time."
  ],
  project_management: [
    "Break down large projects into smaller, manageable milestones. Each milestone should be completable in 1-2 weeks.",
    "Create a project timeline with buffer time for unexpected issues. Plan for 20% extra time for unknowns.",
    "Set up regular progress reviews to track against your timeline and adjust plans as needed.",
    "Identify critical path items early - these are tasks that will delay the entire project if they're late."
  ],
  technical_implementation: [
    "Start with a clear technical specification. Document the requirements, constraints, and acceptance criteria before coding.",
    "Consider creating a proof of concept for complex features to validate the approach before full implementation.",
    "Break technical tasks into smaller units that can be tested independently. This makes debugging easier.",
    "Set up automated testing early to catch issues before they become bigger problems."
  ],
  time_estimation: [
    "Use the three-point estimation: best case, most likely, and worst case. Take the average and add 20% buffer.",
    "Look at similar past tasks to estimate current work. Historical data is often the best predictor.",
    "Consider task complexity, your experience level, and potential blockers when estimating time.",
    "Break complex tasks into smaller pieces for more accurate estimation. Each piece should be 1-3 days of work."
  ],
  motivation: [
    "Remember why this work matters. Connect your daily tasks to the bigger project goals and team success.",
    "Celebrate small wins along the way. Completing even minor tasks builds momentum and motivation.",
    "Take regular breaks to prevent burnout. Your brain needs rest to maintain creativity and focus.",
    "Focus on progress, not perfection. Every step forward, no matter how small, moves you closer to your goals."
  ],
  general: [
    "I'm here to help with your project and task management questions. What specific challenge are you facing right now?",
    "I can assist with prioritization, productivity tips, team collaboration, or technical implementation. What do you need help with?",
    "Let me know what you're working on and I can provide targeted advice for your situation.",
    "I'm ready to help clear any doubts about your tasks, projects, or team collaboration. What's on your mind?"
  ]
};

// Topic detection function
function detectTopic(message: string): string {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes("priorit") || messageLower.includes("urgent") || messageLower.includes("important") || 
      messageLower.includes("what should i do") || messageLower.includes("which task")) {
    return "task_prioritization";
  }
  
  if (messageLower.includes("productiv") || messageLower.includes("efficient") || messageLower.includes("focus") || 
      messageLower.includes("time management") || messageLower.includes("distract") || messageLower.includes("procrastinat")) {
    return "productivity";
  }
  
  if (messageLower.includes("team") || messageLower.includes("collaborat") || messageLower.includes("communicat") || 
      messageLower.includes("work together") || messageLower.includes("delegate") || messageLower.includes("conflict")) {
    return "team_collaboration";
  }
  
  if (messageLower.includes("project") || messageLower.includes("timeline") || messageLower.includes("deadline") || 
      messageLower.includes("planning") || messageLower.includes("scope") || messageLower.includes("milestone")) {
    return "project_management";
  }
  
  if (messageLower.includes("implement") || messageLower.includes("code") || messageLower.includes("technical") || 
      messageLower.includes("bug") || messageLower.includes("error") || messageLower.includes("development")) {
    return "technical_implementation";
  }
  
  if (messageLower.includes("deadline") || messageLower.includes("due") || messageLower.includes("when") || 
      messageLower.includes("estimate") || messageLower.includes("complete") || messageLower.includes("how long")) {
    return "time_estimation";
  }

  if (messageLower.includes("stress") || messageLower.includes("overwhelm") || messageLower.includes("motivat") || 
      messageLower.includes("burnout") || messageLower.includes("tired") || messageLower.includes("frustrat")) {
    return "motivation";
  }

  return "general";
}

// Generate static response
function generateStaticResponse(message: string): string {
  const topic = detectTopic(message);
  const responses = STATIC_RESPONSES[topic as keyof typeof STATIC_RESPONSES] || STATIC_RESPONSES.general;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Main chat handler with static responses
export async function handleChatRequest(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.user!.id;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Generate static response
    const aiResponse = generateStaticResponse(message);
    const topic = detectTopic(message);
    
    // Return the static response
    res.json({ 
      response: aiResponse,
      topic: topic,
      confidence: 0.9 // High confidence for static responses
    });
    
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat request",
      fallback: "I'm having trouble processing your request right now. Please try again in a moment."
    });
  }
}