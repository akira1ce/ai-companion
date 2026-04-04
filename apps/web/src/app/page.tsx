import { ChatPanel } from "./components/chat-panel";
import { SiderPanel } from "./components/sider-panel";

export default function HomePage() {
	return (
		<div className="flex h-screen w-screen">
			<SiderPanel className="hidden shrink-0 lg:block" />
			<ChatPanel className="flex-1" />
		</div>
	);
}
