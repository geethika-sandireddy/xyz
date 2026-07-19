// Ready-to-send negotiation and cancellation message templates.
// These are carefully crafted for Indian service providers and sound natural.
// Designed to be replaced by Gemini-generated messages when API key is available.

export interface MessageContext {
  serviceName: string;
  amount: number;
  frequency: string;
}

const cancelTemplates: Record<string, string[]> = {
  streaming: [
    `Hi,\n\nI'd like to cancel my {service} subscription (₹{amount}/{freq}) with immediate effect.\n\nI've been a subscriber but I'm not using the service regularly enough to justify the cost. Please confirm the cancellation and ensure no further charges are made to my account.\n\nThank you.`,
    `Dear {service} Support,\n\nPlease cancel my subscription of ₹{amount}/{freq}. I want to make sure the auto-renewal is also disabled so I am not charged in the next cycle.\n\nKindly send a confirmation once done.\n\nBest regards`,
  ],
  fitness: [
    `Hi,\n\nI'd like to cancel my membership at ₹{amount}/{freq}. Due to personal reasons I'm unable to continue using {service} regularly.\n\nCould you please process the cancellation and let me know if there are any steps I need to take? I'd also appreciate a confirmation email.\n\nThank you.`,
  ],
  software: [
    `Hello {service} Team,\n\nI want to cancel my subscription of ₹{amount}/{freq}. Please ensure the auto-renewal is turned off and I receive confirmation of the cancellation.\n\nIf there's any data I need to export before the subscription ends, please let me know the process.\n\nThanks.`,
  ],
  default: [
    `Hi,\n\nI would like to cancel my {service} subscription currently billed at ₹{amount}/{freq}.\n\nPlease process this request and ensure no future charges. I'd appreciate a written confirmation.\n\nThank you for your time.`,
  ],
};

const negotiateTemplates: Record<string, string[]> = {
  streaming: [
    `Hi {service} Team,\n\nI've been a loyal subscriber for a while, currently paying ₹{amount}/{freq}. I recently noticed some better deals available for new customers and I was hoping you could extend a similar offer to me as a returning customer.\n\nI genuinely enjoy {service} but the current pricing is making me reconsider. If you're able to offer a loyalty discount or a reduced plan, I'd be happy to stay on.\n\nLooking forward to your response.`,
  ],
  fitness: [
    `Hi,\n\nI'm currently a {service} member at ₹{amount}/{freq}. Due to some financial constraints, I wanted to check if there's a discounted rate, a pause option, or a lighter plan I could switch to rather than cancelling entirely.\n\nI value the service and would prefer to continue — just at a more manageable cost.\n\nThank you for considering.`,
  ],
  default: [
    `Dear {service} Support,\n\nI'm a current subscriber paying ₹{amount}/{freq}. I'm reviewing my monthly expenses and this subscription is becoming difficult to justify at the current price.\n\nAre there any loyalty discounts, seasonal offers, or downgrade options available? I'd prefer to stay on rather than cancel, but I do need the pricing to work for my budget.\n\nWaiting to hear from you.`,
  ],
};

const downgradeTemplates: Record<string, string[]> = {
  default: [
    `Hi {service} Team,\n\nI'm currently on a plan at ₹{amount}/{freq}. I'd like to explore downgrading to a more basic or affordable tier.\n\nCould you let me know what lower-cost options are available and how to switch? I'd like to retain access to the core features while reducing my monthly spend.\n\nThank you.`,
  ],
  streaming: [
    `Hello,\n\nI currently have {service} at ₹{amount}/{freq}. I'd like to move to a lower-tier plan — perhaps a basic or mobile-only option if available.\n\nPlease guide me through the downgrade process and confirm the new billing amount.\n\nThanks.`,
  ],
};

function pickTemplate(templates: Record<string, string[]>, category: string): string {
  const pool = templates[category] ?? templates["default"] ?? ["Please contact {service} to {action} your subscription of ₹{amount}/{freq}."];
  return pool[Math.floor(Math.random() * pool.length)];
}

function fillTemplate(template: string, ctx: MessageContext): string {
  return template
    .replace(/\{service\}/g, ctx.serviceName)
    .replace(/\{amount\}/g, ctx.amount.toLocaleString("en-IN"))
    .replace(/\{freq\}/g, ctx.frequency === "annual" ? "year" : ctx.frequency === "weekly" ? "week" : "month")
    .replace(/\{action\}/g, "manage");
}

export function generateMessage(
  type: "cancel" | "negotiate" | "downgrade",
  ctx: MessageContext,
  category: string = "other"
): string {
  let template: string;

  if (type === "cancel") {
    template = pickTemplate(cancelTemplates, category);
  } else if (type === "negotiate") {
    template = pickTemplate(negotiateTemplates, category);
  } else {
    template = pickTemplate(downgradeTemplates, category);
  }

  return fillTemplate(template, ctx);
}
