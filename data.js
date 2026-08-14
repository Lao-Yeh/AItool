const DEFAULT_DATA = {
  categories: [
    {
      id: "ai",
      name: "AI 大補帖",
      icon: "🤖",
      subcategories: [
        {
          name: "圖片生成＆調整",
          items: [
            { id: "ai-img-1", name: "Raphael", url: "https://reurl.cc/mYA897", tags: [], note: "" },
            { id: "ai-img-2", name: "Krea", url: "https://reurl.cc/5Rzjqn", tags: [], note: "要使用英文輸入指令" },
            { id: "ai-img-3", name: "Gemini nano banana", url: "https://reurl.cc/Nx9vXQ", tags: [], note: "" },
            { id: "ai-img-4", name: "Recraft", url: "https://reurl.cc/Nx9v66", tags: ["需要點數"], note: "" },
            { id: "ai-img-5", name: "插畫屋", url: "https://reurl.cc/GNO8mx", tags: ["圖庫"], note: "" },
            { id: "ai-img-6", name: "Pngimg", url: "https://reurl.cc/QazKxb", tags: ["圖庫"], note: "" },
            { id: "ai-img-7", name: "midjourney", url: "https://reurl.cc/pYAl6e", tags: ["付費使用"], note: "" },
            { id: "ai-img-8", name: "mixboard", url: "https://reurl.cc/W8l3Ve", tags: [], note: "" }
          ]
        },
        {
          name: "上課資料整理",
          items: [
            { id: "ai-class-1", name: "NotebookLM", url: "https://reurl.cc/Nx9v66", tags: [], note: "" },
            { id: "ai-class-2", name: "EdrawMind", url: "", tags: [], note: "電腦桌面" },
            { id: "ai-class-3", name: "GitMind", url: "", tags: [], note: "電腦桌面" },
            { id: "ai-class-4", name: "BlackBox", url: "https://reurl.cc/Qaxre5", tags: [], note: "" },
            { id: "ai-class-5", name: "ClassMory", url: "", tags: [], note: "" }
          ]
        },
        {
          name: "雜七雜八ㄉ種類",
          items: [
            { id: "ai-misc-1", name: "Manus", url: "https://reurl.cc/5Rzj8z", tags: [], note: "程式方面好用但有限制" },
            { id: "ai-misc-2", name: "Zoo", url: "https://reurl.cc/GNO8mx", tags: ["3D建模"], note: "" },
            { id: "ai-misc-3", name: "MecAgent", url: "https://reurl.cc/GNO8XZ", tags: ["3D建模"], note: "" },
            { id: "ai-misc-4", name: "Kuse", url: "https://reurl.cc/jrozln", tags: [], note: "" },
            { id: "ai-misc-5", name: "Jitter", url: "https://reurl.cc/4NnKWX", tags: [], note: "" },
            { id: "ai-misc-6", name: "Perplexity", url: "", tags: [], note: "" },
            { id: "ai-misc-7", name: "Elmo Chat", url: "", tags: [], note: "" },
            { id: "ai-misc-8", name: "Claude", url: "", tags: [], note: "" },
            { id: "ai-misc-9", name: "Genie 3", url: "https://reurl.cc/Lnqy67", tags: [], note: "" },
            { id: "ai-misc-10", name: "flourish", url: "https://flourish.studio/", tags: ["動畫圖表"], note: "" }
          ]
        }
      ]
    },
    {
      id: "tools",
      name: "感覺很好用的小工具們",
      icon: "🧰",
      items: [
        { id: "tool-1", name: "縮短網址", url: "https://reurl.cc/main/tw", tags: [], note: "Notion用" },
        { id: "tool-2", name: "遊戲網站", url: "https://reurl.cc/koDKmL", tags: [], note: "多人遊戲，手機可當遙控器" },
        { id: "tool-3", name: "線上桌遊", url: "https://reurl.cc/OR906A", tags: [], note: "" },
        { id: "tool-4", name: "templatemaker", url: "https://reurl.cc/9WLGMn", tags: [], note: "盒子產生器" },
        { id: "tool-5", name: "Nim", url: "https://reurl.cc/MzVpRk", tags: [], note: "製作影片" },
        { id: "tool-6", name: "Paperanimator", url: "https://reurl.cc/ek1Kom", tags: [], note: "製作影片" },
        { id: "tool-7", name: "Higgsfield", url: "https://reurl.cc/WOlKoO", tags: [], note: "製作影片" },
        { id: "tool-8", name: "imagen", url: "https://reurl.cc/nYegDe", tags: [], note: "AI調色，但好像要有預設集" },
        { id: "tool-9", name: "Copilot", url: "", tags: [], note: "" },
        { id: "tool-10", name: "Chathub", url: "", tags: [], note: "" },
        { id: "tool-11", name: "Grok", url: "", tags: [], note: "" }
      ]
    }
  ]
};
