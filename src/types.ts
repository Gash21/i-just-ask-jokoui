export interface JokoComponent {
  id: string;
  name: string;
  category: "application" | "marketing";
  description: string;
  tags: string[];
  url?: string;
}
