export type AgentCategory =
  | "Travel"
  | "Education"
  | "Data"
  | "Engineering"
  | "Compute"
  | "Research"
  | "Business";

export type HostingMode = "publisher-hosted" | "market-hosted";

export type ParameterField =
  | {
      id: string;
      label: string;
      type: "text" | "url" | "textarea" | "date" | "number";
      placeholder: string;
      required?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "select";
      placeholder: string;
      options: string[];
      required?: boolean;
    };

export type Review = {
  author: string;
  rating: number;
  comment: string;
};

export type Agent = {
  id: string;
  name: string;
  publisher: string;
  tagline: string;
  description: string;
  category: AgentCategory;
  tags: string[];
  hostingMode: HostingMode;
  priceSats: number;
  rating: number;
  reviewCount: number;
  successRate: number;
  estimatedRuntime: string;
  refundable: boolean;
  parameters: ParameterField[];
  sampleOutput: string;
  reviews: Review[];
};

export type AgentMatch = {
  agent: Agent;
  score: number;
  reasons: string[];
  badge: "Cheapest" | "Best rated" | "Fastest" | "Premium" | "Strong match";
};

export type JobStatus = "idle" | "paid" | "queued" | "running" | "succeeded" | "failed" | "refunded";

export type Job = {
  id: string;
  agentId: string;
  status: JobStatus;
  paidSats: number;
  paymentHash?: string;
  preimage?: string;
  result?: string;
};
