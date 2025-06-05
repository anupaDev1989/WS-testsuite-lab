import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Zap, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

interface RateLimitErrorProps {
  error: {
    error?: string;
    message?: string;
    userMessage?: string;
    details?: {
      retryAfter?: number;
      retryAfterHuman?: string;
      friendlyLimit?: string;
      endpointType?: string;
      docs?: string;
    };
    actions?: Array<{
      label: string;
      description?: string;
      url?: string;
    }>;
  };
  onRetry?: () => void;
  className?: string;
}

export function RateLimitError({ error, onRetry, className = "" }: RateLimitErrorProps) {
  const [timeLeft, setTimeLeft] = useState<number>(
    error.details?.retryAfter || 60
  );

  useEffect(() => {
    if (!error.details?.retryAfter) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error.details?.retryAfter]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `about ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const timeRemaining = timeLeft > 0 ? formatTime(timeLeft) : 'a moment';

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">
        {error.details?.endpointType === 'LLM' 
          ? 'AI Processing Limit Reached' 
          : 'Too Many Requests'}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <div>
          <p className="mb-2">
            {error.userMessage || error.message || 'You have exceeded the rate limit for this action.'}
          </p>
          {error.details?.friendlyLimit && (
            <p className="text-sm text-muted-foreground">
              Current limit: {error.details.friendlyLimit}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {timeLeft > 0 
              ? `Please try again in ${timeRemaining}.`
              : 'You can try again now.'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {timeLeft <= 0 && onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Try Again
            </Button>
          )}

          {error.actions?.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              asChild={!!action.url}
              className="gap-2"
            >
              {action.url ? (
                <a href={action.url} target="_blank" rel="noopener noreferrer">
                  {action.label}
                </a>
              ) : (
                <span>{action.label}</span>
              )}
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default RateLimitError;
