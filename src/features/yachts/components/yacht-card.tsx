import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Yacht } from "../schema";

const metres = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  style: "unit",
  unit: "meter",
});

export function YachtCard({ yacht }: { yacht: Yacht }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{yacht.model}</Badge>
          <Badge variant="outline">{yacht.yearBuilt}</Badge>
        </div>
        <CardTitle>{yacht.name}</CardTitle>
        <CardDescription>{yacht.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div>
            <dt>Length</dt>
            <dd className="text-foreground">
              {metres.format(yacht.lengthOverallMeters)}
            </dd>
          </div>
          <div>
            <dt>Beam</dt>
            <dd className="text-foreground">
              {metres.format(yacht.beamMeters)}
            </dd>
          </div>
          <div>
            <dt>Draft</dt>
            <dd className="text-foreground">
              {metres.format(yacht.draftMeters)}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link href={{ pathname: "/contact", query: { yacht: yacht.slug } }}>
            Enquire about {yacht.name}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
