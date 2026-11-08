import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

export default function sitemap(): MetadataRoute.Sitemap {
  return sidebarItems.flatMap((group) =>
    group.items.flatMap((item) =>
      "url" in item
        ? [
            {
              url: `${APP_CONFIG.url}${item.url}`,
              lastModified: new Date(),
            },
          ]
        : [],
    ),
  );
}
