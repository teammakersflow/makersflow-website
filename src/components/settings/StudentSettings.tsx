import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./ProfileTab";
import { NotificationsTab } from "./NotificationsTab";
import { BillingTab } from "./BillingTab";
import { SecurityTab } from "./SecurityTab";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export function StudentSettings() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="flex flex-col gap-6 lg:flex-row">
            {/* Mobile: Horizontal scroll tabs */}
            <TabsList className="h-auto w-full flex-row justify-start gap-1 overflow-x-auto bg-white p-2 lg:w-56 lg:flex-col lg:overflow-x-visible">
              <TabsTrigger
                value="profile"
                className="shrink-0 justify-start border-l-2 border-transparent px-4 py-2.5 lg:w-full lg:text-left data-[state=active]:border-[#4F46E5] data-[state=active]:bg-indigo-50 data-[state=active]:text-[#4F46E5]"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="shrink-0 justify-start border-l-2 border-transparent px-4 py-2.5 lg:w-full lg:text-left data-[state=active]:border-[#4F46E5] data-[state=active]:bg-indigo-50 data-[state=active]:text-[#4F46E5]"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="shrink-0 justify-start border-l-2 border-transparent px-4 py-2.5 lg:w-full lg:text-left data-[state=active]:border-[#4F46E5] data-[state=active]:bg-indigo-50 data-[state=active]:text-[#4F46E5]"
              >
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="shrink-0 justify-start border-l-2 border-transparent px-4 py-2.5 lg:w-full lg:text-left data-[state=active]:border-[#4F46E5] data-[state=active]:bg-indigo-50 data-[state=active]:text-[#4F46E5]"
              >
                Security
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              <TabsContent value="profile" className="mt-0">
                <ProfileTab />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab />
              </TabsContent>
              <TabsContent value="billing" className="mt-0">
                <BillingTab />
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <SecurityTab />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
