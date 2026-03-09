---
title: Daily Blog: LLM Finetuning Plan
date: 2026-03-09
tags: Hugging Face, Gemma, LLM Fine Tuning
summary: A daily blog telling about update mostly of LLM fine-tuning this time.
---

# GenAI Project: Finetuning Gemma-270M for SQL queries

Started of with LLM Finetuning project planning to wrap-up this project within this week. Goal of this project is to create a finetuned Gemma-270M-Instruction model for SQL queries. This finetuned model will be used to create a production SQL Agent something like what Uber built using langchain for their production environments.

As of listing out these few links which i found very usefull:

- https://github.com/adithya-s-k/AI-Engineering.academy/tree/main/archives
- https://huggingface.co/google/gemma-3-270m-it
- https://huggingface.co/datasets/gretelai/synthetic_text_to_sql
- https://huggingface.co/blog/gemma-peft
- https://github.com/google-gemini/gemma-cookbook/tree/main/Gemma

## Some of formal documentation I made for the project 😉

### Objective
Develop and train a domain-specific LLM capable of generating accurate and efficient SQL queries through supervised fine-tuning techniques.

### Model Architecture
- **Base Model**: Gemma-3-270M
  - URL: https://huggingface.co/google/gemma-3-270m-it
  - Parameter Count: 270M (selected due to computational constraints)

### Dataset
- **Source**: Gretel AI Synthetic Text-to-SQL Dataset
  - URL: https://huggingface.co/datasets/gretelai/synthetic_text_to_sql
  - Size: 100,000 rows
  - Type: Synthetic text-to-SQL query pairs

# Code flow

LLM finetuning will first start by loading model using quantization (in our case not), then followed by PEFT (Parametric Efficient Training), followed by training loop (SFTT Trainer for PyTorch). Important code snippet is below.

Model Loading
```python
import torch
import os
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

model_id = "google/gemma-2b"
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

tokenizer = AutoTokenizer.from_pretrained(model_id, token=os.environ['HF_TOKEN'])
model = AutoModelForCausalLM.from_pretrained(model_id, quantization_config=bnb_config, device_map={"":0}, token=os.environ['HF_TOKEN'])
```

PEFT - LoraConfig

```python
from peft import LoraConfig

lora_config = LoraConfig(
    r=8,
    target_modules=["q_proj", "o_proj", "k_proj", "v_proj", "gate_proj", "up_proj", "down_proj"],
    task_type="CAUSAL_LM",
)
```

SFTT - Trainer

```python
import transformers
from trl import SFTTrainer

def formatting_func(example):
    text = f"Quote: {example['quote'][0]}\nAuthor: {example['author'][0]}<eos>"
    return [text]

trainer = SFTTrainer(
    model=model,
    train_dataset=data["train"],
    args=transformers.TrainingArguments(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        warmup_steps=2,
        max_steps=10,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=1,
        output_dir="outputs",
        optim="paged_adamw_8bit"
    ),
    peft_config=lora_config,
    formatting_func=formatting_func,
)
trainer.train()
```


As of now was just looking up docs and reading articles will start implementation from the listed key components.

_Updated: March 9, 2026_