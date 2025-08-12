"use client";

import { useState } from "react";
import {
  Avatar, AvatarFallback, AvatarImage,
  Button, Card, CardContent, Dialog, DialogContent,
  DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label
} from "valkoma-package/primitive";
import { Edit, Plus, Trash2, User } from "lucide-react";
import { useToast } from "valkoma-package/hooks";
import { useBudget, type Participant } from "@/context/budget-context";
export default function MembersTab() {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Participant | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberImage, setMemberImage] = useState("");
  const [memberNotes, setMemberNotes] = useState("");

  const { toast } = useToast();
  const { group, addParticipant, removeParticipant, updateGroup } = useBudget();

  const resetForm = () => {
    setMemberName("");
    setMemberPhone("");
    setMemberImage("");
    setMemberNotes("");
    setEditingMember(null);
  };

  const handleAddOrUpdate = () => {
    if (!memberName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    if (editingMember) {
      updateGroup({
        members: group.members.map(m =>
          m.id === editingMember.id
            ? { ...m, name: memberName.trim(), phone: memberPhone || undefined, image: memberImage || undefined, notes: memberNotes || undefined }
            : m
        ),
      });
      toast({ title: "Success", description: `${memberName} updated` });
    } else {
      addParticipant({
        name: memberName.trim(),
        phone: memberPhone || undefined,
        image: memberImage || undefined,
        notes: memberNotes || undefined,
      });
      toast({ title: "Success", description: `${memberName} added` });
    }

    resetForm();
    setIsAddMemberOpen(false);
  };

  const deleteMember = (id: string) => {
    const member = group.members.find(m => m.id === id);
    if (!member) return;

    const hasExpenses = group.expenses.some(
      exp => exp.paidBy === id || exp.splits.some(s => s.participantId === id)
    );

    if (hasExpenses) {
      toast({
        title: "Cannot Delete Member",
        description: "This member has expenses. Reassign or delete them first.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Remove ${member.name}?`)) {
      removeParticipant(id);
      toast({ title: "Removed", description: `${member.name} deleted` });
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Group Members</h2>
        <Dialog
          open={isAddMemberOpen || !!editingMember}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
              setIsAddMemberOpen(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Update member info." : "Add a new member to this group."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={memberName} onChange={e => setMemberName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={memberPhone} onChange={e => setMemberPhone(e.target.value)} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={memberImage} onChange={e => setMemberImage(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={memberNotes} onChange={e => setMemberNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleAddOrUpdate}>
                  {editingMember ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {group.members.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <User className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground mb-2">No members yet.</p>
            <Button onClick={() => setIsAddMemberOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y border rounded-md overflow-hidden">
          {group.members.map(member => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.image || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{member.name}</div>
                  {member.phone && (
                    <div className="text-xs text-muted-foreground truncate">{member.phone}</div>
                  )}
                  {member.notes && (
                    <div className="text-xs text-muted-foreground truncate">{member.notes}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingMember(member);
                    setIsAddMemberOpen(true);
                    setMemberName(member.name);
                    setMemberPhone(member.phone || "");
                    setMemberImage(member.image || "");
                    setMemberNotes(member.notes || "");
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMember(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
