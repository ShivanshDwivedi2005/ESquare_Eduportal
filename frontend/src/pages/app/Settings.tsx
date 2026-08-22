import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/components/app/ThemeProvider';
import { studentProfile } from '@/mock-data';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, set } = useTheme();
  if (!user) return null;

  return (
    <>
      <PageHeader eyebrow="You" title="Settings" description="Account, privacy, notifications and appearance." />

      <Tabs defaultValue="account">
        <TabsList className="flex-wrap">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4 space-y-4">
          <SectionCard title="Profile details" bodyClassName="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="s-name">Full name</Label><Input id="s-name" defaultValue={user.name} /></div>
              <div className="space-y-2"><Label htmlFor="s-username">Username</Label><Input id="s-username" defaultValue={user.username} /></div>
              <div className="space-y-2"><Label htmlFor="s-email">Email</Label><Input id="s-email" type="email" defaultValue={user.email} /></div>
              <div className="space-y-2"><Label htmlFor="s-location">Location</Label><Input id="s-location" defaultValue={user.location ?? ''} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="s-bio">Bio</Label><Textarea id="s-bio" defaultValue={studentProfile.bio} /></div>
            <Button onClick={() => toast.success('Profile updated')}>Save changes</Button>
          </SectionCard>

          <SectionCard title="Institution association" bodyClassName="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{user.institutionName ?? 'No institution connected'}</p>
                <p className="text-xs text-muted-foreground">ESQUARE ID {user.publicId}</p>
              </div>
              <Badge variant={user.associationStatus === 'verified' ? 'default' : 'secondary'} className="capitalize">
                {(user.associationStatus ?? 'not connected').replace('_', ' ')}
              </Badge>
            </div>
          </SectionCard>

          <SectionCard title="Danger zone" bodyClassName="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Sign out of this workspace on this device.</p>
              <Button variant="destructive" onClick={() => void logout()}>Sign out</Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <SectionCard title="Visibility" bodyClassName="p-5 space-y-4">
            {[
              ['Public profile', 'Anyone on the internet can view your profile'],
              ['Show academic record', 'Display Overall % and attendance on your profile'],
              ['Allow direct messages', 'Receive messages from people outside your institution'],
              ['Show in recruiter search', 'Let verified organizations discover your profile'],
            ].map(([label, desc], i) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                <Switch defaultChecked={i !== 1} />
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <SectionCard title="Notification preferences" bodyClassName="p-5 space-y-4">
            {['Academic updates', 'Social activity', 'Opportunity alerts', 'Requests and invitations', 'Administrative notices'].map((label) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{label}</p>
                <Switch defaultChecked />
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <SectionCard title="Appearance" bodyClassName="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => set(v as 'light' | 'dark')}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">Compact density</p><p className="text-xs text-muted-foreground">Reduce padding across tables and lists</p></div>
              <Switch />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
