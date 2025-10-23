

# Interesting moments
## 1.  Fixing my Friending concept specification
I worked on my Friending concept for last week's assignment and added 'removeFriend', which I noticed was missing. I manually added this to the specification. I also forgot to add changes I made to my concept specification that made functions more efficient, so I tried prompting to fix my concept specification.
[fixing-Friending](../brainstorming/fixing-Friending.md)

[prompt.4bc45502](../../context/design/brainstorming/fixing-Friending.md/steps/prompt.4bc45502.md)
[response.ad038bda](../../context/design/brainstorming/fixing-Friending.md/steps/response.ad038bda.md)

[prompt.5e623e69](../../context/design/brainstorming/fixing-Friending.md/steps/prompt.5e623e69.md)
[response.8091ec02](../../context/design/brainstorming/fixing-Friending.md/steps/response.8091ec02.md)
The resulting output was disappointing, since the syntax errors in the generated concept specification that I pointed out were not fixed. I could've tested this more by including less broad context and only including context about certain areas I wanted fixed, for example, the state, but I opted to fix them manually instead since it would not be too much work. I also added actions to my concept spec corresponding to the additional helper functions that I realized my Friending concept needed while implementing it. After this incident, I decided to only manually fix my concept specifications in order to be in control of technical/design decisions that affect performance, correctness, and implementation of new functionality.

## 2. LLM hallucinated a Str type based on given context, during implementation of Friending 
Surprisingly, this only happened once at the beginning, and never happened again. I expected this to happen a lot more given that the context to most of my implementation prompts include the same files, but it seemed to just be a one time fluke.

[prompt.3c59ca21](../../context/design/concepts/Friending/implementation.md/steps/prompt.3c59ca21.md)
[response.d357686a](../../context/design/concepts/Friending/implementation.md/steps/response.d357686a.md)

[prompt.c56fd296](../../context/design/concepts/Friending/implementation.md/steps/prompt.c56fd296.md)
[response.9a11ca8a](../../context/design/concepts/Friending/implementation.md/steps/response.9a11ca8a.md)

## 3. LLM seemed to require more context/more defined concept specification: left many comments starting with "In a real-world scenario..."
The LLM didn't seem to understand the purpose of the implementation, and left comments that indicated many parts of the code were just placeholders. It seems that that's how it dealt with ambiguity. This happened a few times during implementation of multiple concepts and I learned to make my concept spec more detailed to avoid this issue.

You can see the phrase "In a real scenario" in places where the LLM marked places of ambiguity in the examples below:
[file.9d0c969b](../../context/design/concepts/ArcTracking/implementation.md/steps/file.9d0c969b.md)
[response.0c398b7d](../../context/design/concepts/ArcTracking/implementation.md/steps/response.0c398b7d.md)

## 4. LLM always makes the same path alias bugs when generating initial code: resolving path to the concept implementation file from the test file and using @jsr/@std/assert instead of jsr:@std/assert
I found myself constantly having to specify in prompts to correct for certain common mistakes in the LLM generated code, and maybe 10% of the time, the LLM would initially generate code that fixed the issue.

Here is just one example of where that happened:
[response.32b50a1d](../../context/design/concepts/StatTracking/testing.md/steps/response.32b50a1d.md)

## 5. Hallucinated the import path to a module: https://deno.land/x/bcrypt@0.4.0/mod.ts
While the bcrypt module actually existed and was used correctly, the LLM generated the wrong import path to it, which was interesting.

This occurred when the LLM generated the authentication concept code without hashing the password to store it, leaving comments that said that passwords should be hashed in a real implementation (refer to bullet point 3 on this page, it means I didn't clarify that it should've been hashed in the concept spec).
[prompt.9e9a2f2b](../../context/design/concepts/Authentication/implementation.md/steps/prompt.9e9a2f2b.md)
[response.da97aabb](../../context/design/concepts/Authentication/implementation.md/steps/response.da97aabb.md)