

# Interesting moments
## 1.  Fixing my Friending concept specification
I worked on my Friending concept for last week's assignment and added 'removeFriend', which I noticed was missing. I manually added this to the specification. I also forgot to add changes I made to my concept specification that made functions more efficient, so I tried prompting to fix my concept specification.
[fixing-Friending](../brainstorming/fixing-Friending.md)

[prompt.4bc45502](../../context/design/brainstorming/fixing-Friending.md/steps/prompt.4bc45502.md)
[response.ad038bda](../../context/design/brainstorming/fixing-Friending.md/steps/response.ad038bda.md)

[prompt.5e623e69](../../context/design/brainstorming/fixing-Friending.md/steps/prompt.5e623e69.md)
[response.8091ec02](../../context/design/brainstorming/fixing-Friending.md/steps/response.8091ec02.md)
The resulting output was disappointing, since the syntax errors in the generated concept specification that I pointed out were not fixed. I could've tested this more by including less broad context and only including context about certain areas I wanted fixed, for example, the state, but I opted to fix them manually instead since it would not be too much work. I also added actions to my concept spec corresponding to the additional helper functions that I realized my Friending concept needed while implementing it.

## 2. LLM hallucinated a Str type based on given context, during implementation of Friending 


## 3. LLM seemed to require more context: left many comments starting with "In a real-world scenario..."
The LLM didn't seem to understand the purpose of the implementation, and left comments 


## 4. LLM always makes the same bugs: resolving path to the concept implementation file from the test file and jsr:@std/assert


## 5. Hallucinated the import path to a module: https://deno.land/x/bcrypt@0.4.0/mod.ts

## 6. The constructor was generated twice.