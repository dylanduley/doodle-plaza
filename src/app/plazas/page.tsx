import type { Metadata } from "next";
import { PlazaCard, SectionBar } from "@/components/ui/Blocks";
import { PlazasIcon } from "@/components/ui/icons";
import { plazas } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Plazas" };

export default function PlazasPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="film">
        <h1 className="logo-text text-4xl">Plazas</h1>
        <p className="mt-2 font-bold text-pretty text-white">
          Every plaza is a little gathering spot with its own theme. Pick one and start doodling.
        </p>
      </section>
      <SectionBar icon={<PlazasIcon size={20} />} title={`All plazas (${plazas.length})`} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plazas.map((p) => (
          <li key={p.slug} className="flex">
            <PlazaCard plaza={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
