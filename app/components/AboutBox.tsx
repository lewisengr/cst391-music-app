import Link from "next/link";

export default function AboutBox() {
  return (
    <section className="card shadow-sm">
      <div className="card-body p-4">
        <h1 className="card-title">About My Music</h1>
        <p className="card-subtitle mb-3 text-body-secondary">Dylan Lewis · CST-391 Activity 5</p>
        <p className="card-text">Browse the album collection, search by title or artist, and add or edit albums.</p>
        <Link href="/" className="btn btn-primary">Home</Link>
      </div>
      <div className="card-footer">
        <a href="https://getbootstrap.com/docs/5.3/components/card/#example">
          Adapted from the Bootstrap card example
        </a>
      </div>
    </section>
  );
}
