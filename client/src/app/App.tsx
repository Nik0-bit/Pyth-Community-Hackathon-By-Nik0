import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ChatTerminal } from './components/ChatTerminal';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <ChatTerminal />
        <RightSidebar />
      </div>
    </div>
  );
}
