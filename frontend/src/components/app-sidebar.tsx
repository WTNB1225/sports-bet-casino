import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Home, Settings, User, LayoutDashboard } from "lucide-react"

export function AppSidebar() {
  return (
      <Sidebar collapsible="icon">
        {/* サイドバーのヘッダー部分にトリガーを配置 */}
        <SidebarHeader className="flex flex-row items-center justify-between p-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg">My App</span>
          </div>
          {/* ここがポイント：Sidebar内部にTriggerを入れる */}
          <SidebarTrigger className="hover:bg-slate-200 transition-colors" />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
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