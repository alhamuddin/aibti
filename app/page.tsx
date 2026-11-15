import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Landmark,
  Laptop,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { HomeNavbar } from "@/components/navigation/home-navbar";
import { getSession } from "@/lib/session";

export const instant = false;

const learningAreas = [
  {
    number: "01",
    title: "Financial and technical expertise",
    description:
      "Build capability in credit appraisal, financial analysis, liquidity, foreign exchange, and portfolio quality.",
    image: "/svg/a%20(2).svg",
    alt: "Trainer presenting financial charts and analysis",
    icon: ChartNoAxesCombined,
  },
  {
    number: "02",
    title: "Compliance and governance",
    description:
      "Keep AML/CFT, KYC/CDD, regulatory guidance, ethics, and responsible banking at the heart of learning.",
    image: null,
    alt: "",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Digital banking and cyber readiness",
    description:
      "Develop digital literacy, safe technology practices, and confidence with evolving banking channels.",
    image: "/svg/a%20(7).svg",
    alt: "Employees learning with a digital training platform",
    icon: Laptop,
  },
  {
    number: "04",
    title: "Leadership and customer service",
    description:
      "Strengthen communication, customer care, coaching, and ethical decision-making across roles.",
    image: "/svg/a%20(1).svg",
    alt: "Colleagues discussing a training presentation",
    icon: UsersRound,
  },
];

const outcomes = [
  {
    icon: CircleDollarSign,
    title: "Stronger risk decisions",
    description:
      "Credit appraisal and early-warning skills help teams recognize risk and make informed decisions.",
  },
  {
    icon: BadgeCheck,
    title: "Confident compliance",
    description:
      "Regular learning helps employees respond to changing regulatory requirements and procedures.",
  },
  {
    icon: UsersRound,
    title: "Better customer experiences",
    description:
      "Communication, empathy, and service skills help build trust at every customer touchpoint.",
  },
];

const learningPrinciples = [
  {
    icon: ClipboardList,
    number: "01",
    title: "Understand the need",
    description: "Use role and competency needs to shape relevant training priorities.",
  },
  {
    icon: BookOpenCheck,
    number: "02",
    title: "Make learning accessible",
    description: "Support flexible, mobile-friendly learning for teams across locations.",
  },
  {
    icon: BrainCircuit,
    number: "03",
    title: "Connect learning to work",
    description: "Encourage practical application with follow-up and supervisory support.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "04",
    title: "Keep improving",
    description: "Use progress and feedback to refine future learning experiences.",
  },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <>
      <HomeNavbar userName={session?.user.name} />
      <main>
        <section
          id="platform"
          className="border-border relative isolate scroll-mt-24 overflow-hidden border-b"
        >
          <div
            aria-hidden="true"
            className="bg-brand-400/15 pointer-events-none absolute -top-32 -right-32 -z-10 size-[34rem] rounded-full blur-3xl"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <span className="border-brand-600/25 bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-wide">
                <Sparkles aria-hidden="true" className="text-brand-600 size-3.5" />
                Al-Arafah Islami Bank Training Institute
              </span>
              <h1 className="text-foreground mt-6 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Learning for a
                <span className="text-brand-800 dark:text-brand-400 block">
                  stronger banking future.
                </span>
              </h1>
              <p className="text-muted-foreground mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
                Build the attitude, skills, and knowledge banking professionals need to navigate
                regulatory change, manage risk, serve customers, and adapt to digital finance.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={session ? "/dashboard" : "/login"}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {session ? "Open your learning portal" : "Sign in to the learning portal"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <a
                  href="#learning-areas"
                  className="border-border bg-card text-foreground hover:bg-accent inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors"
                >
                  Explore learning areas
                  <ArrowDownRight aria-hidden="true" className="size-4" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Technical skills", "Compliance", "Digital readiness"].map((item) => (
                  <span
                    key={item}
                    className="border-border bg-card/80 text-muted-foreground rounded-full border px-3 py-1.5 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div
                aria-hidden="true"
                className="from-brand-400/25 to-brand-800/20 absolute -inset-5 rounded-[2rem] bg-linear-to-br via-transparent blur-2xl"
              />
              <div className="border-border bg-card relative overflow-hidden rounded-[1.75rem] border p-3 shadow-[0_32px_100px_-44px_rgba(0,84,97,0.42)] sm:p-4">
                <Image
                  src="/svg/a%20(3).svg"
                  alt="A team working together to solve a problem"
                  width={3181}
                  height={2100}
                  priority
                  unoptimized
                  className="h-auto w-full rounded-[1.25rem]"
                  sizes="(max-width: 1024px) 100vw, 48vw"
                />
                <div className="absolute right-6 bottom-6 left-6 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur sm:right-8 sm:bottom-8 sm:left-8 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#005461]">
                      <Landmark aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#102b2d]">
                        Skills that strengthen the whole bank
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#5d7474]">
                        Practical learning for a changing financial landscape.
                      </p>
                    </div>
                    <span className="ml-auto hidden size-2 shrink-0 rounded-full bg-[#249e94] sm:block" />
                  </div>
                </div>
              </div>
              <div className="border-border bg-card text-card-foreground absolute -top-4 -right-2 hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-md sm:flex">
                <ShieldCheck aria-hidden="true" className="text-brand-600 size-4" />
                Knowledge · Skill · Attitude
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Banking learning priorities"
          className="border-border bg-card border-b"
        >
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { icon: Scale, title: "Regulatory confidence", note: "AML/CFT · KYC/CDD" },
              {
                icon: CircleDollarSign,
                title: "Sound financial skills",
                note: "Credit · Risk · FX",
              },
              { icon: Laptop, title: "Digital capability", note: "FinTech · Cyber hygiene" },
              { icon: UsersRound, title: "People and service", note: "Leadership · Customers" },
            ].map(({ icon: Icon, title, note }) => (
              <div key={title} className="flex items-center gap-3 px-1 py-2">
                <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="text-foreground block text-sm font-semibold">{title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">{note}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="learning-areas" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-primary text-sm font-bold tracking-wide uppercase">
                  Learning for banking in Bangladesh
                </p>
                <h2 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Build capability where it matters most.
                </h2>
              </div>
              <p className="text-muted-foreground max-w-lg text-sm leading-6 sm:text-base">
                From sound financial judgment to digital confidence, relevant learning helps
                employees respond to the changing needs of banking.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {learningAreas.map(({ number, title, description, image, alt, icon: Icon }) => (
                <article
                  key={title}
                  className="group border-border bg-card overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="bg-secondary/60 relative flex h-40 items-center justify-center overflow-hidden p-4">
                    {image ? (
                      <Image
                        src={image}
                        alt={alt}
                        width={2000}
                        height={1500}
                        unoptimized
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <div className="bg-brand-400/20 absolute size-28 rounded-full blur-2xl" />
                        <span className="bg-card text-brand-800 dark:text-brand-400 relative flex size-20 items-center justify-center rounded-3xl shadow-sm">
                          <Icon aria-hidden="true" className="size-9" />
                        </span>
                        <span className="bg-brand-light absolute top-7 right-[22%] size-3 rounded-full" />
                        <span className="bg-brand-600 absolute bottom-7 left-[24%] size-2 rounded-full" />
                      </div>
                    )}
                    <span className="border-border/60 bg-card/90 text-muted-foreground absolute top-3 left-3 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest">
                      {number}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-card-foreground font-bold">{title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
                    <div className="text-primary mt-4 flex items-center gap-1.5 text-xs font-semibold">
                      A foundation for growth
                      <ChevronRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="border-border bg-card scroll-mt-24 border-y py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
            <div>
              <p className="text-primary text-sm font-bold tracking-wide uppercase">
                From learning to lasting impact
              </p>
              <h2 className="text-foreground mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                Training is an investment in trust and resilience.
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-7">
                Structured professional development supports the people behind safe, responsive, and
                customer-focused banking.
              </p>
              <Link
                href={session ? "/dashboard" : "/login"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors"
              >
                {session ? "Visit your learning portal" : "Start your learning journey"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {outcomes.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="border-border bg-background hover:border-brand-600/50 rounded-2xl border p-5 transition-colors"
                >
                  <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-foreground mt-4 text-sm font-bold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-xs leading-5">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="approach" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-primary text-sm font-bold tracking-wide uppercase">
                A thoughtful learning cycle
              </p>
              <h2 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Relevant before, during, and after training.
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-7">
                Move beyond one-off sessions with learning shaped by real needs and reinforced in
                day-to-day work.
              </p>
            </div>
            <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {learningPrinciples.map(({ icon: Icon, number, title, description }, index) => (
                <article
                  key={title}
                  className="border-border bg-card relative rounded-2xl border p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-xl">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-brand-600 font-mono text-xs font-semibold">{number}</span>
                  </div>
                  <h3 className="text-card-foreground mt-5 font-bold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
                  {index < learningPrinciples.length - 1 ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="bg-background text-brand-600 absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 rounded-full lg:block"
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="teams" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="border-border bg-primary text-primary-foreground mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] border lg:grid-cols-[1fr_0.9fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <p className="text-primary-foreground/75 text-sm font-bold tracking-wide uppercase">
                Learning for every location
              </p>
              <h2 className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                Bring learning closer to every branch.
              </h2>
              <p className="text-primary-foreground/80 mt-4 max-w-xl text-sm leading-6 sm:text-base sm:leading-7">
                Mobile-friendly digital learning can help teams across urban, semi-urban, and rural
                locations access learning opportunities and keep pace with change.
              </p>
              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  "Flexible digital learning",
                  "Role-relevant development",
                  "Practical skills for the branch",
                  "Continuous professional growth",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-white/15">
                      <Check aria-hidden="true" className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex min-h-64 items-center justify-center bg-white/95 p-6 sm:min-h-80 sm:p-10">
              <Image
                src="/svg/a%20(8).svg"
                alt="Employees using a digital learning platform together"
                width={4743}
                height={3162}
                unoptimized
                className="h-auto max-h-80 w-full object-contain"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <span className="absolute right-4 bottom-4 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-[#005461] shadow-sm sm:right-7 sm:bottom-7">
                Learn across locations
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer id="about" className="border-border bg-background scroll-mt-24 border-t">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 md:grid-cols-[1.1fr_1fr_0.8fr] lg:px-8">
          <div>
            <div className="text-foreground flex items-center gap-2 font-semibold">
              <BookOpenCheck aria-hidden="true" className="text-primary size-5" />
              AIBTI
            </div>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-6">
              Al-Arafah Islami Bank Training Institute
            </p>
          </div>
          <address className="text-muted-foreground space-y-3 text-sm not-italic">
            <p className="text-foreground font-semibold">Contact the institute</p>
            <p className="flex items-start gap-2.5 leading-6">
              <MapPin aria-hidden="true" className="text-primary mt-1 size-4 shrink-0" />
              <span>Surma Tower (Floor-14), 59/2, Purana Paltan, Dhaka 1000</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone aria-hidden="true" className="text-primary size-4 shrink-0" />
              <span>44850087-9 (PABX)</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail aria-hidden="true" className="text-primary size-4 shrink-0" />
              <a className="hover:text-primary hover:underline" href="mailto:aibtri@aibl.com.bd">
                training@aibl.com.bd
              </a>
            </p>
          </address>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="text-muted-foreground text-sm">
              Advancing knowledge, skills, and attitude for banking professionals.
            </p>
            <Link href="/login" className="text-primary text-sm font-semibold hover:underline">
              Employee sign in
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
