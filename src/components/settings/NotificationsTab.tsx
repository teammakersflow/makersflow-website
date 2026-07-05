import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const initialPreferences = {
  emailNotifications: true,
  pushNotifications: false,
  courseUpdates: true,
  assignmentReminders: true,
  gradeNotifications: true,
  messageNotifications: false,
  weeklyDigest: true,
  promotionalEmails: false,
};

export function NotificationsTab() {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
    setHasChanges(changed);
  }, [preferences]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    console.log("Saving notification preferences:", preferences);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications and updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-500">Receive push notifications on your device</p>
              </div>
              <Switch
                id="pushNotifications"
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleToggle("pushNotifications")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900">Course Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="courseUpdates" className="text-sm font-medium">
                  Course Updates
                </Label>
                <p className="text-sm text-gray-500">Get notified about course changes</p>
              </div>
              <Switch
                id="courseUpdates"
                checked={preferences.courseUpdates}
                onCheckedChange={() => handleToggle("courseUpdates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="assignmentReminders" className="text-sm font-medium">
                  Assignment Reminders
                </Label>
                <p className="text-sm text-gray-500">Reminders for upcoming assignments</p>
              </div>
              <Switch
                id="assignmentReminders"
                checked={preferences.assignmentReminders}
                onCheckedChange={() => handleToggle("assignmentReminders")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gradeNotifications" className="text-sm font-medium">
                  Grade Notifications
                </Label>
                <p className="text-sm text-gray-500">Alerts when grades are posted</p>
              </div>
              <Switch
                id="gradeNotifications"
                checked={preferences.gradeNotifications}
                onCheckedChange={() => handleToggle("gradeNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="messageNotifications" className="text-sm font-medium">
                  Message Notifications
                </Label>
                <p className="text-sm text-gray-500">Notifications for new messages</p>
              </div>
              <Switch
                id="messageNotifications"
                checked={preferences.messageNotifications}
                onCheckedChange={() => handleToggle("messageNotifications")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900">Digest & Marketing</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weeklyDigest" className="text-sm font-medium">
                  Weekly Digest
                </Label>
                <p className="text-sm text-gray-500">Weekly summary of your activity</p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={preferences.weeklyDigest}
                onCheckedChange={() => handleToggle("weeklyDigest")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotionalEmails" className="text-sm font-medium">
                  Promotional Emails
                </Label>
                <p className="text-sm text-gray-500">Updates about new courses and features</p>
              </div>
              <Switch
                id="promotionalEmails"
                checked={preferences.promotionalEmails}
                onCheckedChange={() => handleToggle("promotionalEmails")}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end border-t bg-white pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50"
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
