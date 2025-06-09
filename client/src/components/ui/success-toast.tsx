import { Check } from "lucide-react";
import { useToast } from "./use-toast";

interface UseSuccessToastProps {
  title?: string;
  description?: string;
  duration?: number;
}

export function useSuccessToast() {
  const { toast } = useToast();
  
  return ({ 
    title = "Success", 
    description = "Operation completed successfully", 
    duration = 3000 
  }: UseSuccessToastProps = {}) => {
    toast({
      title,
      description,
      duration,
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-800",
      icon: <Check className="h-5 w-5 text-green-500" />,
    });
  };
}
