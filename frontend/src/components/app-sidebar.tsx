import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarTrigger
} from "@/components/ui/sidebar"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router"
import { Settings, User, LayoutDashboard, ChevronRight } from "lucide-react"
import { hc } from "hono/client"
import type { AppType } from "../../../backend/src/index";

type ContentState = "SPORTS" | "CASINO" | "NONE"

type Sport = {
    id: string;
    name: string;
};

type League = {
    id: string;
    name: string;
    sportId: string;
}

export function AppSidebar() {
    const [content, setContent] = useState<ContentState>("NONE");
    const [sports, setSports] = useState<Sport[]>([]);
    const [leaguesBySport, setLeaguesBySport] = useState<Record<string, League[]>>({});
    const [openSportId, setOpenSportId] = useState<string | null>(null);
    const [loadingSportId, setLoadingSportId] = useState<string | null>(null);
    const location = useLocation();
    const client = useMemo(
        () => hc<AppType>(import.meta.env.VITE_BACKEND_URL as string),
        []
    );

    async function fetchLeaguesBySportId(sportId: string) {
        if (leaguesBySport[sportId]) {
            return;
        }
        setLoadingSportId(sportId);
        try {
            const res = await client.events.leagues.$get({
                query: {
                    sportId,
                }
            });
            if (!res.ok) {
                console.error("Failed to fetch leagues for sportId:", sportId);
                return;
            }
            const data = await res.json();
            setLeaguesBySport((prev) => ({
                ...prev,
                [sportId]: data,
            }));
        } catch (error) {
            console.error("Error fetching leagues:", error);
        } finally {
            setLoadingSportId(null);
        }
    }

    const handleSportToggle = async (sportId: string) => {
        if (openSportId === sportId) {
            setOpenSportId(null);
            return;
        }

        setOpenSportId(sportId);
        await fetchLeaguesBySportId(sportId);
    }

    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith("/sports")) {
            setContent("SPORTS");
        } else if (path.startsWith("/casino")) {
            setContent("CASINO");
        } else {
            setContent("NONE");
        }
        const fetchSports = async () => {
            try {
                const res = await client.events.sports.$get();
                if (!res.ok) {
                    throw new Error("Failed to fetch sports");
                }
                const data = await res.json();
                setSports(data);
            } catch (error) {
                console.error("Error fetching sports:", error);
            }
        }
        fetchSports();
    }, [client]);

    return (
        <Sidebar collapsible="icon">
            {/* サイドバーのヘッダー部分にトリガーを配置 */}
            <SidebarHeader className="flex flex-row items-center justify-between p-4 group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center gap-5 group-data-[collapsible=icon]:hidden">
                    <Link to="/casino" onClick={() => setContent("CASINO")}>Casino</Link>
                    <Link to="/sports" onClick={() => setContent("SPORTS")}>Sports</Link>
                </div>
                <SidebarTrigger className="hover:bg-slate-200 transition-colors" />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    {content === "SPORTS" ? (
                        <SidebarMenu>
                            {sports.map((sport) => (
                                <SidebarMenuItem key={sport.id}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            void handleSportToggle(sport.id);
                                        }}
                                        className="justify-between"
                                    >
                                        <span>{sport.name}</span>
                                        <ChevronRight
                                            className={`size-4 transition-transform ${openSportId === sport.id ? "rotate-90" : ""}`}
                                        />
                                    </SidebarMenuButton>

                                    {openSportId === sport.id ? (
                                        <SidebarMenuSub>
                                            {loadingSportId === sport.id ? (
                                                <SidebarMenuSubItem>
                                                    <span className="px-2 text-xs text-muted-foreground">Loading...</span>
                                                </SidebarMenuSubItem>
                                            ) : null}

                                            {(leaguesBySport[sport.id] ?? []).map((league) => (
                                                <SidebarMenuSubItem key={league.id}>
                                                    <SidebarMenuSubButton asChild>
                                                        <Link to={`/sports/${sport.id}/${league.id}`}>
                                                            {league.name}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}

                                            {loadingSportId !== sport.id && (leaguesBySport[sport.id] ?? []).length === 0 ? (
                                                <SidebarMenuSubItem>
                                                    <span className="px-2 text-xs text-muted-foreground">No leagues</span>
                                                </SidebarMenuSubItem>
                                            ) : null}
                                        </SidebarMenuSub>
                                    ) : null}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    ) : content === "CASINO" ? (
                        <SidebarMenu>

                        </SidebarMenu>
                    ) : (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to="/">Home</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {[
                                { title: "Dashboard", icon: LayoutDashboard },
                                { title: "Profile", icon: User },
                                { title: "Settings", icon: Settings },
                            ].map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href="#">
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}