"use client";

import { Header } from "@/components/header";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { t } = useTranslation();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const heroImage = PlaceHolderImages.find((img) => img.id === "hero");
  const featureLoggingImage = PlaceHolderImages.find(
    (img) => img.id === "feature-logging"
  );
  const featureFeedbackImage = PlaceHolderImages.find(
    (img) => img.id === "feature-feedback"
  );
  const featureProgressImage = PlaceHolderImages.find(
    (img) => img.id === "feature-progress"
  );

  const features = [
    {
      title: t("home.features.feature1.title"),
      description: t("home.features.feature1.description"),
      image: featureLoggingImage,
    },
    {
      title: t("home.features.feature2.title"),
      description: t("home.features.feature2.description"),
      image: featureFeedbackImage,
    },
    {
      title: t("home.features.feature3.title"),
      description: t("home.features.feature3.description"),
      image: featureProgressImage,
    },
  ];

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    {t("home.hero.title")}
                  </h1>
                  <p className="max-w-full sm:max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl">
                    {t("home.hero.subtitle")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row items-start sm:items-center">
                  {user ? (
                    <Button
                      asChild
                      size="lg"
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                      <Link href="/overview">
                        Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        size="lg"
                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                      >
                        <Link href="/register">
                          {t("home.hero.ctaNutritionist")}{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Link href="/login">{t("home.hero.ctaPatient")}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-xl shadow-2xl lg:h-auto">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full bg-secondary py-12 md:py-24 lg:py-32"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  {t("home.features.tag")}
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                  {t("home.features.title")}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t("home.features.subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <CardHeader>
                    {feature.image && (
                      <div className="relative mb-4 h-40 w-full overflow-hidden rounded-md">
                        <Image
                          src={feature.image.imageUrl}
                          alt={feature.image.description}
                          fill
                          className="object-cover"
                          data-ai-hint={feature.image.imageHint}
                        />
                      </div>
                    )}
                    <CardTitle className="font-headline">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                {t("home.forProfessionals.tag")}
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("home.forProfessionals.title")}
              </h2>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">
                      {t("home.forProfessionals.feature1.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("home.forProfessionals.feature1.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">
                      {t("home.forProfessionals.feature2.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("home.forProfessionals.feature2.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">
                      {t("home.forProfessionals.feature3.title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("home.forProfessionals.feature3.description")}
                    </p>
                  </div>
                </li>
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/register">
                  {t("home.forProfessionals.cta")}{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-xl bg-secondary p-8 shadow-lg">
                <p className="text-lg italic text-foreground">
                  {t("home.forProfessionals.testimonial")}
                </p>
                <p className="mt-4 font-semibold text-right">
                  {t("home.forProfessionals.testimonialAuthor")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo textClassName="text-foreground" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              {t("home.footer.motto")}
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            {t("home.footer.copyright").replace(
              "{year}",
              String(new Date().getFullYear())
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
