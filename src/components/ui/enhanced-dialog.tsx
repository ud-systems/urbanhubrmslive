import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const EnhancedDialog = DialogPrimitive.Root

const EnhancedDialogTrigger = DialogPrimitive.Trigger

const EnhancedDialogPortal = DialogPrimitive.Portal

const EnhancedDialogClose = DialogPrimitive.Close

const EnhancedDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
EnhancedDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface EnhancedDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  enableSteps?: boolean;
  totalSteps?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  longDialog?: boolean;
}

const EnhancedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  EnhancedDialogContentProps
>(({ className, children, enableSteps = false, totalSteps = 1, currentStep = 1, onStepChange, longDialog = false, ...props }, ref) => (
  <EnhancedDialogPortal>
    <EnhancedDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        // Mobile-specific styling: remove excessive padding, animate from bottom
        "p-4 md:p-6", // Proper padding - not excessive
        "max-h-[90vh] overflow-y-auto", // Handle long dialogs
        // Mobile animation from bottom with zero margin bottom
        "dialog-content",
        longDialog && "max-w-2xl md:max-w-4xl", // Larger for long dialogs
        className
      )}
      {...props}
    >
      {/* First Close Button - Top Right (Standard) */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      
      {/* Second Close Button - Top Left (Rule Compliance) */}
      <DialogPrimitive.Close className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-3 w-3" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      
      {/* Step Progress for Long Dialogs */}
      {enableSteps && totalSteps > 1 && (
        <div className="mt-8 mb-4 px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          
          {/* Step Navigation */}
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStepChange?.(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStepChange?.(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === totalSteps}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {children}
    </DialogPrimitive.Content>
  </EnhancedDialogPortal>
))
EnhancedDialogContent.displayName = DialogPrimitive.Content.displayName

const EnhancedDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mt-8", // Add top margin for close buttons
      className
    )}
    {...props}
  />
)
EnhancedDialogHeader.displayName = "EnhancedDialogHeader"

const EnhancedDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
)
EnhancedDialogFooter.displayName = "EnhancedDialogFooter"

const EnhancedDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnhancedDialogTitle.displayName = DialogPrimitive.Title.displayName

const EnhancedDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  EnhancedDialog,
  EnhancedDialogPortal,
  EnhancedDialogOverlay,
  EnhancedDialogClose,
  EnhancedDialogTrigger,
  EnhancedDialogContent,
  EnhancedDialogHeader,
  EnhancedDialogFooter,
  EnhancedDialogTitle,
  EnhancedDialogDescription,
} 