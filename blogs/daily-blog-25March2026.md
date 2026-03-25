---
title: Daily Blog: SQL-Gemma3 uploaded on Hugging Face
date: 2026-03-25
tags: Hugging Face, Gemma, SQL, Fine Tuning
summary: A quick update on shipping my first text-to-SQL finetuned Gemma model and publishing it on Hugging Face.
---

# GenAI Project Update: SQL-Gemma3 is now live

On March 9, 2026, I wrote about planning a Gemma fine-tuning project for SQL generation. Today that model is uploaded on Hugging Face:

- https://huggingface.co/vishnurchityala/sql-gemma3

This is the first public version of the text-to-SQL model I wanted to build. Earlier it was mostly planning and docs, now there is an actual model to test.

## What changed from the earlier plan

In the earlier post, I was still thinking about Gemma-3-270M as the starting point. For the uploaded release, I fine-tuned `unsloth/gemma-3-1b-it`.

Current model card highlights:

- **Model name**: `vishnurchityala/sql-gemma3`
- **Base model**: `unsloth/gemma-3-1b-it`
- **Task**: Natural language to SQL
- **Dataset**: balanced sampled subset of `gretelai/synthetic_text_to_sql`
- **Reported training loss**: `0.201`
- **Reported test loss**: `0.21`

## Why this model matters

The core idea is simple: give the model a database schema plus a natural language question, and get SQL back. This is the base for the SQL agent work I want to do later.

Right now, I see this model as:

- a checkpoint that proves the fine-tuning pipeline actually works
- a baseline for more text-to-SQL experiments
- a good starting point before I build stronger evaluation and safety checks around it

## Example usage

The current model card on Hugging Face uses a `transformers` inference flow like below:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

model_id = "vishnurchityala/sql-gemma3"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

messages = [
    {
        "role": "user",
        "content": (
            "CREATE TABLE employees(id INT, name TEXT, salary INT);\n\n"
            "Find the average salary of all employees."
        ),
    }
]

inputs = tokenizer(
    tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    ),
    return_tensors="pt",
)

outputs = model.generate(**inputs, max_new_tokens=128, do_sample=False)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

This makes the project much more concrete because I can now run prompts directly against the model and inspect the SQL it generates.

## Training pipeline I used

I also now have a proper Unsloth supervised fine-tuning pipeline. The overall flow was:

- load Gemma with Unsloth
- apply LoRA adapters for efficient fine-tuning
- convert the Gretel text-to-SQL dataset into chat-style user and assistant turns
- train with `trl.SFTTrainer`
- save the LoRA adapter
- merge the adapter back into a full model
- run a quick generation test on a sample SQL prompt

This was the core training shape:

```python
from datasets import load_dataset
from unsloth import FastModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only
from trl import SFTTrainer, SFTConfig
from peft import PeftModel

model, tokenizer = FastModel.from_pretrained(
    model_name="unsloth/gemma-3-270m-it",
    max_seq_length=1024,
    load_in_4bit=True,
)

model = FastModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "v_proj", "o_proj"],
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
)

tokenizer = get_chat_template(tokenizer, chat_template="gemma3")

train_ds = load_dataset("gretelai/synthetic_text_to_sql", split="train")
test_ds = load_dataset("gretelai/synthetic_text_to_sql", split="test")

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=train_ds,
    eval_dataset=test_ds,
    args=SFTConfig(
        dataset_text_field="text",
        per_device_train_batch_size=4,
        gradient_accumulation_steps=2,
        num_train_epochs=1,
        learning_rate=2e-4,
        optim="adamw_8bit",
        output_dir="./logs/",
        report_to="none",
    ),
)

trainer = train_on_responses_only(
    trainer,
    instruction_part="<start_of_turn>user\n",
    response_part="<start_of_turn>model\n",
)

trainer.train()
```

The useful part here was the dataset formatting step. Each record was converted into a chat-style example where the user message contains `sql_context` plus `sql_prompt`, and the assistant message contains the final SQL. That matches the actual text-to-SQL use case much better.

## What is still missing

This is not a production-ready SQL model yet. The current model card already makes that clear:

- evaluation is summarized using loss, not execution accuracy
- output quality still depends heavily on schema clarity and prompt structure
- invalid or dialect-specific SQL can still happen

The next step is not just more training. I need a better evaluation loop around correctness, schema faithfulness, and read-only safety.

## Closing note

This blog is the continuation of my March 9, 2026 post. Back then it was planning. On March 25, 2026, it became a published model.

_Updated: March 25, 2026_
