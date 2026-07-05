import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialData = {
  cardNumber: "**** **** **** 4242",
  cardHolder: "John Doe",
  expiryDate: "12/25",
  billingAddress: "123 Student Lane",
  city: "Boston",
  state: "MA",
  zipCode: "02101",
  country: "United States",
};

export function BillingTab() {
  const [formData, setFormData] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Saving billing data:", formData);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Payment</CardTitle>
        <CardDescription>Manage your payment methods and billing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-lg font-semibold text-[#4F46E5]">Student Premium</p>
            </div>
            <p className="text-2xl font-bold">$9.99/mo</p>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => handleChange("cardNumber", e.target.value)}
              placeholder="1234 5678 9012 3456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardHolder">Cardholder Name</Label>
            <Input
              id="cardHolder"
              value={formData.cardHolder}
              onChange={(e) => handleChange("cardHolder", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                placeholder="MM/YY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" maxLength={3} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900">Billing Address</h3>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Street Address</Label>
            <Input
              id="billingAddress"
              value={formData.billingAddress}
              onChange={(e) => handleChange("billingAddress", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleChange("zipCode", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleChange("country", value)}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                </SelectContent>
              </Select>
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
