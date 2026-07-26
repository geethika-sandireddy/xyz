import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import {
  useListSharePlanRequests,
  useCreateSharePlanRequest,
  useDeleteSharePlanRequest,
  getListSharePlanRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Loader2, Trash2, Search } from "lucide-react";

export default function SharePlans() {
  const sessionId = useSession();
  const queryClient = useQueryClient();

  const [serviceName, setServiceName] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const myRequests = useListSharePlanRequests(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getListSharePlanRequestsQueryKey({ sessionId }) } }
  );

  const matches = useListSharePlanRequests(
    { serviceName: searchTerm, sessionId },
    {
      query: {
        enabled: searchTerm.length > 1,
        queryKey: getListSharePlanRequestsQueryKey({ serviceName: searchTerm, sessionId }),
      },
    }
  );

  const createMutation = useCreateSharePlanRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSharePlanRequestsQueryKey({ sessionId }) });
        toast.success("posted — you'll show up when someone searches for this service");
        setServiceName("");
        setMaxMembers("");
        setContactNote("");
      },
    },
  });

  const deleteMutation = useDeleteSharePlanRequest({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSharePlanRequestsQueryKey({ sessionId }) }),
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" /> Share a Plan
        </h1>
        <p className="text-muted-foreground text-lg">
          Splitting a family plan cuts the per-person cost a lot. Post here if you're open to it, or search for someone already looking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post a request</CardTitle>
          <CardDescription>Only what you type here gets shown — don't put personal contact info you're not comfortable sharing publicly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Service</Label>
              <Input placeholder="e.g. YouTube Premium Family" value={serviceName} onChange={e => setServiceName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plan size (optional)</Label>
              <Input placeholder="e.g. 6 members" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">How people should reach you</Label>
            <Input placeholder="e.g. DM on Instagram @handle" value={contactNote} onChange={e => setContactNote(e.target.value)} />
          </div>
          <Button
            className="w-full gap-2"
            disabled={!serviceName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate({ data: { sessionId, serviceName: serviceName.trim(), maxMembers: maxMembers || undefined, contactNote: contactNote || undefined } })}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Post</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Find someone to split with</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="search a service, e.g. Netflix" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {matches.isLoading && searchTerm.length > 1 && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {matches.data && matches.data.length > 0 && (
            <div className="space-y-2">
              {matches.data.map(m => (
                <div key={m.id} className="text-sm border rounded-md p-3 bg-muted/30">
                  <p className="font-medium">{m.serviceName}{m.maxMembers ? ` — ${m.maxMembers}` : ""}</p>
                  {m.contactNote && <p className="text-muted-foreground mt-1">{m.contactNote}</p>}
                </div>
              ))}
            </div>
          )}
          {matches.data && matches.data.length === 0 && searchTerm.length > 1 && !matches.isLoading && (
            <p className="text-sm text-muted-foreground">no one's posted for this yet — be the first above.</p>
          )}
        </CardContent>
      </Card>

      {myRequests.data && myRequests.data.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Your open requests</h3>
          {myRequests.data.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm border rounded-md p-3">
              <span>{r.serviceName}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate({ id: r.id })}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
