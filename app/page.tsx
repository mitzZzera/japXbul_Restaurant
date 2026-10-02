import Link from "next/link";
import { MapPin, Clock3, Mountain, Flame, Flower2 } from "lucide-react";
export default function Home() {
  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/">
          <span className="brand-symbol">空</span>
          <span>
            SORA <i>&</i> SOL<small>JAPANESE SOUL · BULGARIAN HEART</small>
          </span>
        </Link>
        <nav>
          <a href="#story">Our story</a>
          <a href="#menu">The menu</a>
          <a href="#space">The space</a>
          <Link className="button" href="/reservations">
            Find your table
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">TWO CULTURES. ONE TABLE. BANSKO.</p>
            <h1>
              Japanese soul.
              <br />
              <em>Bulgarian heart.</em>
            </h1>
            <p>
              A little Kyoto. A little Pirin.
              <br />
              An unexpected place to feel at home.
            </p>
            <Link className="button cream-button" href="/reservations">
              Come share our table
            </Link>
          </div>
          <div className="hero-bottom">
            <span>
              <MapPin size={15} /> Bansko, at the foot of the Pirin
            </span>
            <span>
              空と太陽 <b>·</b> НЕБЕ И СЛЪНЦЕ
            </span>
            <span>
              <Clock3 size={15} /> Every day · 12:00–23:00
            </span>
          </div>
        </section>
        <div className="culture-strip">
          <span>JAPANESE PRECISION</span>
          <i>✳</i>
          <span>BULGARIAN GENEROSITY</span>
          <i>✳</i>
          <span>MOUNTAIN SPIRIT</span>
          <i>✳</i>
          <span>A PLACE AT THE TABLE</span>
        </div>
        <section id="story" className="story section-wrap">
          <div>
            <p className="eyebrow red">A MEETING OF WORLDS</p>
            <h2>
              Far apart.
              <br />
              <em>Better together.</em>
            </h2>
          </div>
          <div>
            <p className="large-copy">
              The quiet care of a Japanese kitchen.
              <br />
              The open-hearted warmth of a Bulgarian home.
            </p>
            <p>
              Here in Bansko, we bring the two together. Think hand-folded gyoza
              with slow-cooked kavarma, miso beside mountain herbs, and an
              evening that takes its time.
            </p>
            <div className="story-values">
              <span>
                <Mountain />
                Rooted in Pirin
              </span>
              <span>
                <Flame />
                Made with fire
              </span>
              <span>
                <Flower2 />
                Led by the seasons
              </span>
            </div>
          </div>
        </section>
        <section id="menu" className="menu-section section-wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow red">
                FAMILIAR INGREDIENTS. NEW CONVERSATIONS.
              </p>
              <h2>
                A taste of <em>both worlds.</em>
              </h2>
            </div>
            <span className="subtle">Seasonal plates, made for sharing</span>
          </div>
          <div className="menu-feature">
            <div
              className="food-image"
              role="img"
              aria-label="Kavarma gyoza on a charcoal ceramic plate"
            />
            <div className="menu-copy">
              <span className="tiny-tag">THE HOUSE FAVOURITE</span>
              <h3>Kavarma gyoza</h3>
              <p>
                Hand-folded dumplings with slow-braised pork, leek and mountain
                herbs. Finished with roasted pepper ponzu.
              </p>
              <span className="dish-price">
                €14 <small>6 pieces · gluten, soy</small>
              </span>
              <div className="menu-line">
                <div>
                  <h4>Shopska, reimagined</h4>
                  <p>Heirloom tomato, cucumber, sirene & shiso</p>
                </div>
                <b>€11</b>
              </div>
              <div className="menu-line">
                <div>
                  <h4>Miso-glazed mountain trout</h4>
                  <p>Charred leek, sesame & herb butter</p>
                </div>
                <b>€22</b>
              </div>
              <div className="menu-line">
                <div>
                  <h4>Rose & matcha</h4>
                  <p>Bulgarian rose cream, matcha & crisp kadaif</p>
                </div>
                <b>€9</b>
              </div>
              <p className="menu-note">
                Please tell us about any allergies when you visit.
              </p>
            </div>
          </div>
        </section>
        <section id="space" className="space-section section-wrap">
          <div>
            <p className="eyebrow">STAY A LITTLE LONGER</p>
            <h2>
              Your kind
              <br />
              of <em>corner.</em>
            </h2>
            <p>
              A seat by the mountain-view window. A cosy booth for old friends.
              A spot close to the open kitchen. Choose the table that feels like
              you.
            </p>
            <Link className="button cream-button" href="/reservations">
              Explore the tables
            </Link>
          </div>
          <div
            className="window-image"
            role="img"
            aria-label="An intimate window table with a mountain view"
          />
        </section>
        <section className="visit section-wrap">
          <div>
            <p className="eyebrow red">WE’LL SAVE YOU A SEAT</p>
            <h2>
              Good food.
              <br />
              <em>Even better company.</em>
            </h2>
          </div>
          <div>
            <h3>Find us in Bansko</h3>
            <p>
              Old town, Bansko, Bulgaria
              <br />
              At the foot of the Pirin mountains
            </p>
            <p>
              Lunch & dinner, every day
              <br />
              <strong>12:00 – 23:00</strong>
            </p>
            <Link className="button" href="/reservations">
              Make a reservation
            </Link>
          </div>
        </section>
      </main>
      <footer>
        <Link className="footer-brand" href="/">
          SORA & SOL
        </Link>
        <p>Japanese soul. Bulgarian heart. Bansko.</p>
        <span>© {new Date().getFullYear()} Sora & Sol</span>
      </footer>
    </>
  );
}
