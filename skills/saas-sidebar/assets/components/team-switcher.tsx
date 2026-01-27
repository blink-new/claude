"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// TYPES
// =============================================================================

interface TeamSwitcherProps {
  collapsed?: boolean;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  accentColor?: string | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * TeamSwitcher - Displays current team with popover to switch teams
 * 
 * IMPORTANT: NO Tooltip wrapper when collapsed!
 * Tooltip inside PopoverTrigger breaks click handling.
 * The popover itself shows team info when clicked.
 * 
 * @param collapsed - When true, shows icon-only (h-10 w-10 p-0)
 */
export function TeamSwitcher({ collapsed = false }: TeamSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Replace with your own team fetching hook
  // const { data: teamsData, isLoading } = useTeams();
  // const createTeam = useCreateTeam();
  
  // Example data - replace with actual implementation
  const isLoading = false;
  const teams: Team[] = [];
  const currentTeam: Team | null = { id: "1", name: "Acme Inc", slug: "acme" };

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    
    // Replace with actual team creation
    // const team = await createTeam.mutateAsync({ name: newTeamName });
    setNewTeamName("");
    setShowCreateDialog(false);
    // router.push(`/dashboard?team=${team.slug}`);
  }

  // Loading state
  if (isLoading) {
    return collapsed ? (
      <Skeleton className="h-10 w-10 rounded-lg" />
    ) : (
      <Skeleton className="h-10 w-full" />
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {/* ================================================================
            TRIGGER BUTTON
            - NO Tooltip wrapper! (breaks click handling)
            - Collapsed: h-10 w-10 p-0 with centered avatar
            - Expanded: full width with team name + chevron
            ================================================================ */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "cursor-pointer",
              collapsed ? "h-10 w-10 p-0" : "w-full justify-between"
            )}
          >
            {collapsed ? (
              <Avatar className="h-6 w-6">
                {currentTeam?.logo ? (
                  <AvatarImage src={currentTeam.logo} alt={currentTeam.name} />
                ) : null}
                <AvatarFallback
                  className="text-[10px] font-medium"
                  style={currentTeam?.accentColor ? { backgroundColor: currentTeam.accentColor, color: 'white' } : undefined}
                >
                  {currentTeam?.name ? currentTeam.name.charAt(0).toUpperCase() : <Building2 className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            ) : (
              <>
                <div className="flex items-center gap-2 truncate">
                  <Avatar className="h-5 w-5 shrink-0">
                    {currentTeam?.logo ? (
                      <AvatarImage src={currentTeam.logo} alt={currentTeam.name} />
                    ) : null}
                    <AvatarFallback
                      className="text-[10px] font-medium"
                      style={currentTeam?.accentColor ? { backgroundColor: currentTeam.accentColor, color: 'white' } : undefined}
                    >
                      {currentTeam?.name ? currentTeam.name.charAt(0).toUpperCase() : <Building2 className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {currentTeam?.name || "Select team"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        
        {/* ================================================================
            POPOVER CONTENT
            - side="right" when collapsed for proper positioning
            - side="bottom" when expanded
            ================================================================ */}
        <PopoverContent className="w-[200px] p-0" align="start" side={collapsed ? "right" : "bottom"}>
          <Command>
            <CommandInput placeholder="Search teams..." />
            <CommandList>
              <CommandEmpty>No teams found.</CommandEmpty>
              <CommandGroup heading="Teams">
                {teams.map((team) => (
                  <CommandItem
                    key={team.id}
                    value={team.name}
                    onSelect={() => {
                      router.push(`/dashboard?team=${team.slug}`);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentTeam?.id === team.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-5 w-5 mr-2">
                      {team.logo ? (
                        <AvatarImage src={team.logo} alt={team.name} />
                      ) : null}
                      <AvatarFallback
                        className="text-[10px] font-medium"
                        style={team.accentColor ? { backgroundColor: team.accentColor, color: 'white' } : undefined}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {team.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create team
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>
              Create a new team to manage your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
