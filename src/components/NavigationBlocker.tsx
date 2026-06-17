import React from "react";
import { useBlocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NavigationBlockerProps {
  /**
   * If true, navigations will be intercepted.
   */
  isDirty: boolean;
  /**
   * The warning message to display.
   */
  message?: string;
}

/**
 * A declarative component that intercepts React Router navigation
 * when there are unsaved changes (isDirty is true).
 */
export function NavigationBlocker({ 
  isDirty, 
  message = "You have unsaved changes. Are you sure you want to discard them and leave this page?" 
}: NavigationBlockerProps) {
  // useBlocker intercepts navigation if the first argument (isDirty) is true.
  // We specify a function so we can avoid blocking if it's just a query parameter change 
  // on the same path (e.g. going from ?step=1 to ?step=2 should ideally not block if we're saving).
  // But for safety, we'll block all path changes.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  return (
    <AlertDialog open={blocker.state === "blocked"} onOpenChange={(open) => {
      // If the dialog is closed without clicking the Action button, reset the blocker
      if (!open && blocker.state === "blocked") {
        blocker.reset();
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.state === "blocked" && blocker.reset()}>
            Keep Editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.state === "blocked" && blocker.proceed()}>
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
