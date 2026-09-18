package com.jiuwenswarm.study.data

import android.content.Context
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

object ContentImporter {

    private val json = Json { ignoreUnknownKeys = true }

    /** Import the bundled content.json into Room on first launch. */
    suspend fun importIfNeeded(context: Context, db: AppDatabase) {
        if (db.questions().count() > 0) return
        val text = context.assets.open("content.json").bufferedReader().use { it.readText() }
        val root = json.decodeFromString<ContentRoot>(text)

        val topics = root.topics.mapIndexed { i, t -> TopicEntity(t.id, t.title, i) }
        val questions = ArrayList<QuestionEntity>()
        val cards = ArrayList<CardEntity>()
        for (t in root.topics) {
            for (q in t.questions) {
                questions.add(
                    QuestionEntity(
                        id = q.id, topicId = q.topicId, number = q.number, question = q.question,
                        general = q.general, jiuwen = q.jiuwen, gap = q.gap, diagram = q.diagram,
                        anchorsJson = json.encodeToString(q.anchors),
                    )
                )
                cards.add(CardEntity(questionId = q.id))
            }
        }
        db.topics().insertAll(topics)
        db.questions().insertAll(questions)
        db.cards().insertAll(cards)
    }
}
