import { ArrowRight, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Facebook = () => <span className="font-black">f</span>;
const Instagram = () => <span className="text-xs font-black">ig</span>;
const Linkedin = () => <span className="text-xs font-black">in</span>;

const products = [
  {
    name: 'FanXtra',
    subtitle:
      'Yaourt glacé enrichi en vitamines B6, B2, calcium, iode et phosphore.',
    image: '/fan-site/fanxtra.png',
    badge: 'Glacé',
  },
  {
    name: 'FanYogo',
    subtitle: 'Yaourt écrémé aromatisé à la fraise, frais et gourmand.',
    image: '/fan-site/fanyogo.png',
    badge: 'Fraise',
  },
  {
    name: 'FanChoco',
    subtitle:
      'Boisson lactée chocolatée, encore plus de cacao et de gourmandise.',
    image: '/fan-site/fanchoco.jpg',
    badge: 'Cacao',
  },
  {
    name: 'FanVanille',
    subtitle:
      'Boisson au lait aromatisée à la vanille, extra crémeuse et délicieuse.',
    image: '/fan-site/fanvanille.png',
    badge: 'Vanille',
  },
  {
    name: 'FanIce',
    subtitle: 'Crème glacée à la vanille, la pause fraîcheur par excellence.',
    image: '/fan-site/fanice.png',
    badge: 'Glace',
  },
  {
    name: 'Yaourt Nature',
    subtitle: 'Yaourt onctueux nature, source de calcium, en pot individuel.',
    image: '/fan-site/yaourt-nature.png',
    badge: '130 g',
  },
  {
    name: 'Yaourt Vanille',
    subtitle: 'Yaourt sucré à la vanille, onctueux et source de calcium.',
    image: '/fan-site/yaourt-vanille.png',
    badge: '130 g',
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#fffaf0] text-[#122043]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-950/6 bg-[#fffaf0]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#accueil">
            <img
              src="/fan-site/logo-clean.png"
              alt="Logo FanMilk"
              className="h-14 w-auto object-contain"
            />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-extrabold md:flex">
            <a href="#bienfaits">Nos atouts</a>
            <a href="#produits">Produits</a>
            <a href="#ou-acheter">Où acheter</a>
            <a href="#contact">Contact</a>
          </nav>
          <a
            href="/connexion"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'rounded-full bg-[#0a4ea8] px-6 font-black text-white shadow-lg shadow-blue-900/20 hover:bg-[#082f70]',
            )}
          >
            Espace professionnel <ArrowRight />
          </a>
        </div>
      </header>

      <section
        id="accueil"
        className="relative min-h-[760px] bg-[linear-gradient(155deg,#cfeaff_0%,#eef8ff_42%,#ffffff_68%,#fff8da_100%)] pt-20 lg:min-h-screen"
      >
        <div className="fan-blob absolute -left-36 -top-24 size-[520px] rounded-full bg-sky-300/30 blur-2xl" />
        <div className="fan-blob absolute -bottom-40 right-0 size-[430px] rounded-full bg-yellow-200/45 blur-3xl [animation-delay:-4s]" />
        <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[.24em] text-[#0a4ea8]">
              FanMilk Togo
            </p>
            <h1 className="text-[clamp(4rem,8vw,7.4rem)] font-black leading-[.78] tracking-[-.075em] text-[#082f70]">
              Délicieux,
              <br />
              <span className="text-[#0a5bb5]">Onctueux.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg font-semibold leading-8 text-slate-600">
              La fraîcheur FanMilk tous les jours : yaourts, boissons lactées et
              crèmes glacées à savourer en famille ou entre amis.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#produits"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-13 rounded-full bg-[#0a4ea8] px-7 text-base font-black hover:bg-[#082f70]',
                )}
              >
                Voir nos produits <ArrowRight />
              </a>
              <a
                href="#ou-acheter"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-13 rounded-full border-2 border-[#0a4ea8] bg-white/70 px-7 text-base font-black text-[#0a4ea8]',
                )}
              >
                Où acheter
              </a>
            </div>
          </div>
          <div className="fan-yogurt-stage relative min-h-[500px] lg:min-h-[650px]">
            <div className="absolute inset-[6%] rounded-full bg-white/70 shadow-[0_40px_100px_rgba(10,58,145,.17)]" />
            <div className="fan-yogurt-glow absolute inset-[13%] rounded-full" />
            <img
              src="/fan-site/milk-orbit.png"
              alt=""
              aria-hidden="true"
              className="fan-yogurt-splash fan-yogurt-splash-back absolute inset-[13%] z-10 h-[74%] w-[74%] object-contain"
            />
            <img
              src="/fan-site/yaourt-vanille.png"
              alt="Yaourt vanille FanMilk"
              className="fan-float-one absolute right-[1%] top-[3%] z-20 w-[82%] drop-shadow-[0_38px_30px_rgba(10,58,145,.28)]"
            />
            <img
              src="/fan-site/yaourt-nature.png"
              alt="Yaourt nature FanMilk"
              className="fan-float-two absolute bottom-[1%] left-[1%] z-30 w-[79%] drop-shadow-[0_38px_30px_rgba(10,58,145,.28)]"
            />
            <i className="fan-yogurt-drop fan-yogurt-drop-one" />
            <i className="fan-yogurt-drop fan-yogurt-drop-two" />
            <i className="fan-yogurt-drop fan-yogurt-drop-three" />
          </div>
        </div>
      </section>

      <section
        id="bienfaits"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_72%_45%,#0e78db_0%,#0754ad_38%,#052f79_72%,#031d52_100%)] px-5 py-20 text-white lg:px-8 lg:py-24"
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative z-30 py-6 lg:py-14">
            <p className="text-xs font-black uppercase tracking-[.22em] text-yellow-300">
              Pourquoi FanXtra
            </p>
            <h2 className="mt-5 text-[clamp(2.6rem,5vw,4.6rem)] font-black leading-[.98] tracking-tight">
              La fraîcheur
              <br />
              <span className="text-sky-200">en mouvement</span>
            </h2>
            <p className="mt-7 max-w-lg text-lg font-semibold leading-8 text-blue-100/85">
              Deux fois plus de plaisir, entouré d’un tourbillon de lait.
              FanXtra réunit fraîcheur, goût et nutriments essentiels dans un
              yaourt glacé unique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-black">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                Yaourt glacé
              </span>
              <span className="rounded-full bg-yellow-300 px-4 py-2 text-[#082f70]">
                Enrichi en vitamines
              </span>
            </div>
          </div>
          <div className="fan-xtra-stage relative mx-auto h-[520px] w-full max-w-[760px] sm:h-[640px]">
            <div className="fan-orbit-glow absolute inset-[12%] rounded-full" />
            <img
              src="/fan-site/milk-orbit.png"
              alt=""
              aria-hidden="true"
              className="fan-milk-orbit absolute inset-[14%] z-10 h-[72%] w-[72%] object-contain"
            />
            <div className="fan-pack-wrap fan-pack-wrap-one">
              <img
                src="/fan-site/fanxtra.png"
                alt="FanXtra, yaourt glacé FanMilk"
                className="fan-xtra-pack fan-xtra-pack-one"
              />
            </div>
            <div className="fan-pack-wrap fan-pack-wrap-two">
              <img
                src="/fan-site/fanxtra.png"
                alt="Deuxième sachet FanXtra"
                className="fan-xtra-pack fan-xtra-pack-two"
              />
            </div>
            <div className="fan-nutrient fan-nutrient-b2">
              <span>
                B<sub>2</sub>
              </span>
            </div>
            <div className="fan-nutrient fan-nutrient-b6">
              <span>
                B<sub>6</sub>
              </span>
            </div>
            <div className="fan-nutrient fan-nutrient-phosphore">
              <span>PHOSPHORE</span>
            </div>
            <div className="fan-nutrient fan-nutrient-iode">
              <span>IODE</span>
            </div>
            <div className="fan-nutrient fan-nutrient-calcium">
              <span>CALCIUM</span>
            </div>
            <i className="fan-droplet fan-droplet-one" />
            <i className="fan-droplet fan-droplet-two" />
            <i className="fan-droplet fan-droplet-three" />
          </div>
        </div>
      </section>

      <section className="bg-[#082f70] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <img
            src="/fan-site/promo-banner.jpg"
            alt="Yaourts FanMilk nature et vanille"
            className="w-full -rotate-1 rounded-[30px] shadow-2xl"
          />
          <div>
            <p className="text-xs font-black uppercase tracking-[.22em] text-yellow-300">
              Nos yaourts
            </p>
            <h2 className="mt-4 text-4xl font-black">Nature & Vanille</h2>
            <p className="mt-5 text-lg leading-8 text-blue-100/80">
              Onctueux, source de calcium, en pot individuel de 130 g.
            </p>
            <a
              href="#ou-acheter"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'mt-7 rounded-full bg-white px-7 font-black text-[#082f70] hover:bg-yellow-100',
              )}
            >
              Où acheter
            </a>
          </div>
        </div>
      </section>

      <section id="produits" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#0a4ea8]">
              Notre gamme
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-[#082f70]">
              Un FanMilk pour chaque envie
            </h2>
          </div>
          <div
            className="mt-14 grid gap-7"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            }}
          >
            {products.map((product) => (
              <article
                key={product.name}
                className="group relative flex min-h-[430px] flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#edf7ff,#ffffff)] p-6 shadow-[0_14px_30px_rgba(10,58,145,.09)] ring-1 ring-blue-950/5 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="absolute right-5 top-5 z-10 rounded-full bg-yellow-300 px-3 py-1.5 text-[11px] font-black text-[#082f70]">
                  {product.badge}
                </span>
                <div className="grid h-44 place-items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-36 w-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-108"
                  />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#082f70]">
                  {product.name}
                </h3>
                <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-600">
                  {product.subtitle}
                </p>
                <a
                  href="#ou-acheter"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#0a4ea8] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-blue-900/15 transition-transform hover:-translate-y-1"
                >
                  Où acheter <MapPin className="size-4" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ou-acheter" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[40px] bg-[#eaf6ff] shadow-xl lg:grid-cols-2">
          <div className="p-9 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#0a4ea8]">
              Où acheter
            </p>
            <h2 className="mt-4 text-4xl font-black text-[#082f70]">
              Retrouvez FanMilk Togo
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Notre siège est situé dans la Zone Industrielle de Lomé-Port.
              Contactez-nous pour connaître le point de vente ou le dépositaire
              le plus proche.
            </p>
            <div className="mt-8 space-y-4">
              <p className="flex gap-3 font-bold">
                <MapPin className="mt-1 size-5 shrink-0 text-[#0a4ea8]" />
                BP 80 30, Zone Industrielle de Lomé-Port, Togo
              </p>
              <a href="tel:+22822237160" className="flex gap-3 font-bold">
                <Phone className="size-5 text-[#0a4ea8]" />
                +228 22 23 71 60 / 22 23 71 61
              </a>
              <a
                href="https://fanmilk.danone.com/Contact.html"
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 font-bold"
              >
                <Mail className="size-5 text-[#0a4ea8]" />
                Page officielle de contact
              </a>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Fan+Milk+Togo+Zone+Industrielle+Lome+Port"
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'mt-8 rounded-full bg-[#0a4ea8] px-7 font-black text-white hover:bg-[#082f70]',
              )}
            >
              <Navigation />
              Voir l’itinéraire
            </a>
          </div>
          <div className="relative min-h-[430px] bg-[linear-gradient(135deg,#082f70,#0a66c2)] p-10 text-white">
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative flex h-full flex-col justify-between">
              <img
                src="/fan-site/logo-clean.png"
                alt="FanMilk Togo"
                className="h-24 w-fit object-contain"
              />
              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-yellow-300">
                  Horaires indicatifs
                </p>
                <p className="mt-3 text-3xl font-black">Lundi — Vendredi</p>
                <p className="mt-2 text-lg text-blue-100/80">08h00 à 16h00</p>
              </div>
              <p className="text-sm text-blue-100/70">
                Pour une commande ou un renseignement, appelez directement notre
                équipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="bg-[#07162f] px-5 pb-8 pt-16 text-white lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.3fr_.7fr_.8fr_1fr]">
          <div>
            <img
              src="/fan-site/logo-clean.png"
              alt="FanMilk"
              className="h-20 object-contain"
            />
            <p className="mt-5 max-w-sm leading-7 text-blue-100/65">
              Délicieux, Onctueux. Des produits frais et gourmands, accessibles
              partout au Togo.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                aria-label="Facebook"
                href="https://www.facebook.com/FanMilk"
                target="_blank"
                rel="noreferrer"
                className="grid size-11 place-items-center border border-white/20 hover:bg-white/10"
              >
                <Facebook />
              </a>
              <a
                aria-label="Instagram"
                href="https://www.instagram.com/fanmilk/"
                target="_blank"
                rel="noreferrer"
                className="grid size-11 place-items-center border border-white/20 hover:bg-white/10"
              >
                <Instagram />
              </a>
              <a
                aria-label="LinkedIn"
                href="https://www.linkedin.com/company/fan-milk/"
                target="_blank"
                rel="noreferrer"
                className="grid size-11 place-items-center border border-white/20 hover:bg-white/10"
              >
                <Linkedin />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300">
              Produits
            </h3>
            <div className="mt-6 space-y-3 text-blue-100/70">
              <p>FanXtra</p>
              <p>FanYogo</p>
              <p>FanChoco</p>
              <p>FanVanille</p>
              <p>FanIce</p>
              <p>Yaourts</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300">
              Accès pro
            </h3>
            <div className="mt-6 space-y-3 text-blue-100/70">
              <a className="block" href="/connexion">
                Connexion Administrateur
              </a>
              <a className="block" href="/connexion?role=depositaire">
                Connexion Dépositaire
              </a>
              <p>Déclarer les ventes</p>
              <p>Suivre les stocks</p>
              <p>Consulter les objectifs</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300">
              Contact
            </h3>
            <div className="mt-6 space-y-3 text-blue-100/70">
              <p>
                Zone Industrielle
                <br />
                Lomé-Port, Togo
              </p>
              <p>+228 22 23 71 60</p>
              <p>+228 22 23 71 61</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-blue-100/45 sm:flex-row sm:justify-between">
          <p>© 2026 FanMilk Togo. Tous droits réservés.</p>
          <p>Produits · Distribution · Pilotage commercial</p>
        </div>
      </footer>
    </main>
  );
}
