// src/components/portal/ImageCarousel.tsx
"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const dummyImages = [
  {
    src: "/carosel/carosel1.svg",
    alt: "Siswa SMK N 1 Adiwerna sedang membaca",
  },
  {
    src: "/carosel/carosel2.svg",
    alt: "Perpustakaan digital modern",
  },
  {
    src: "/carosel/carosel3.svg",
    alt: "Komunitas baca siswa",
  },
];

export function ImageCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  return (
    <div className="flex flex-col gap-4 mt-1">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent className="mx-2">
          {dummyImages.map((image, index) => (
            <CarouselItem key={index} className="pl-2">
              <div className="overflow-hidden rounded-3xl mt-2 border-2 border-yellow-500">
                <div className="relative flex w-full h-[124px] items-center justify-center">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                    fill
                    priority={index === 0}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* === INDIKATOR TITIK (DOTS) === */}
      <div className="flex justify-center gap-2">
        {dummyImages.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              current === index + 1 ? "w-4 bg-primary" : "bg-primary/30"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}