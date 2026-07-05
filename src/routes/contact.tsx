import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — MakersFlow" },
      {
        name: "description",
        content:
          "Get in touch with MakersFlow. Contact us for course questions, FLOW Bus bookings, technical support, or partnership opportunities.",
      },
    ],
  }),
  component: ContactPage,
});

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function ContactPage() {
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormValues> = {};
    if (!values.name.trim()) newErrors.name = "Name is required";

    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!values.subject) newErrors.subject = "Please select a subject";
    if (!values.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    toast.success("Thank you! Your message has been sent successfully.");
    setValues({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between pt-16">
      <div>
        <Header />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-14 md:py-20">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

          <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-[var(--shadow-glow-primary)]">
              <HelpCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Get in Touch
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Have questions about our futuristic STEM courses, FLOW Bus booking, or want to partner
              with us? Reach out and we'll get back to you shortly.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <main className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Contact Form Card */}
            <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl font-bold">Send us a Message</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Fill out the form below and our team will get in touch with you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={values.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={
                          errors.name ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={values.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={
                          errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </Label>
                    <Select
                      value={values.subject}
                      onValueChange={(val) => handleChange("subject", val)}
                    >
                      <SelectTrigger
                        id="subject"
                        className={
                          errors.subject ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course question">Course question</SelectItem>
                        <SelectItem value="FLOW Bus booking">FLOW Bus booking</SelectItem>
                        <SelectItem value="Technical support">Technical support</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us details about your query..."
                      value={values.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      className={
                        errors.message ? "border-destructive focus-visible:ring-destructive" : ""
                      }
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 font-semibold bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-[var(--shadow-glow-primary)] cursor-pointer"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message <Send className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sidebar Card */}
            <div className="space-y-6">
              <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl overflow-hidden relative">
                {/* Accent line on top */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-accent" />
                <CardHeader className="pt-6">
                  <CardTitle className="font-display text-xl font-bold">Contact Info</CardTitle>
                  <CardDescription className="text-xs">
                    Reach out to us directly through any of these channels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-secondary text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Email Us</p>
                      <a
                        href="mailto:[Add your contact email]"
                        className="text-muted-foreground hover:text-primary transition-colors mt-0.5 block"
                      >
                        [Add your contact email]
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-secondary text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Call Us</p>
                      <p className="text-muted-foreground mt-0.5">
                        [Add your contact phone number]
                      </p>
                    </div>
                  </div>

                  {/* Office */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-secondary text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Our Office</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        [Add your physical/office address]
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lab on wheels teaser card */}
              <Card className="border border-border/50 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl p-5">
                <h3 className="font-display font-bold text-foreground text-base">
                  Lab on Wheels (FLOW Bus)
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Want the futuristic Lab on Wheels bus to visit your school or college? Drop a
                  request in the form choosing <strong>FLOW Bus booking</strong>, and our
                  coordinators will connect for schedules.
                </p>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
