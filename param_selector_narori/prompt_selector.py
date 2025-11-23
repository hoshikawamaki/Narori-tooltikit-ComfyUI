import json

class PromptSelectorNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "prompts_data": "STRING",
                "current_index": "INT"
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "select_prompt"
    CATEGORY = "Narori工具箱"

    def select_prompt(self, unique_id=None, prompts_data=None, current_index=0):
        try:
            if prompts_data:
                prompts = json.loads(prompts_data)
            else:
                prompts = {"默认": "masterpiece, best quality"}
        except:
            prompts = {"默认": "masterpiece, best quality"}
        
        prompt_items = list(prompts.values())
        
        if not prompt_items:
            return ("",)
        
        if current_index >= len(prompt_items):
            current_index = len(prompt_items) - 1
        
        return (prompt_items[current_index],)
    
    @classmethod
    def IS_CHANGED(cls, unique_id=None, prompts_data=None, current_index=0):
        return f"{prompts_data}_{current_index}"

NODE_CLASS_MAPPINGS = {
    "NaroriPromptSelector": PromptSelectorNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NaroriPromptSelector": "提示词选择器 🎯",
}
