import { Quote } from "lucide-react";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const defaultTestimonials: Testimonial[] = [
  {
    quote: "MakersFlow kits made robotics accessible and insanely fun. I built my first line-following robot in just three days!",
    name: "Arjun Verma",
    role: "Grade 10 Innovator",
  },
  {
    quote: "The combination of hands-on hardware and step-by-step video courses is unmatched. Our STEM lab students love it.",
    name: "Priya Nair",
    role: "Robotics Educator",
  },
  {
    quote: "Learning IoT with ESP32 was so straightforward with guided projects. I'm now building a home automation system.",
    name: "Rohan Das",
    role: "Maker & Student",
  },
];

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="rounded-2xl border border-border bg-card p-6">
      <Quote className="size-6 text-primary" aria-hidden="true" />
      <blockquote className="mt-4 text-pretty text-base text-foreground">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-4 text-sm text-muted-foreground">
        — {testimonial.name}, {testimonial.role}
      </figcaption>
    </figure>
  );
}

export function TestimonialGrid({ testimonials = defaultTestimonials }: { testimonials?: Testimonial[] }) {
  if (!testimonials || testimonials.length === 0) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial.name + testimonial.quote} testimonial={testimonial} />
      ))}
    </div>
  );
}
